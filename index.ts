// ======================================================================================
// CHECK IT AI - SUPABASE EDGE FUNCTION: verify-claim
// Deno runtime with Google Gen AI SDK (gemini-2.5-flash with Google Search Grounding)
// ======================================================================================

import { GoogleGenAI, Type } from "npm:@google/genai";
import { createClient } from "npm:@supabase/supabase-js@2";

// 1. CORS Headers for Cross-Origin Browser Invocation
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface VerifyRequestBody {
  claimText?: string;
  imageBase64?: string;
  imageMimeType?: string;
  inputType?: "text" | "link" | "media";
  userId?: string;
}

interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

interface FactCheckResult {
  verdict: "TRUE" | "FALSE" | "MISLEADING" | "UNVERIFIED";
  confidence: number;
  summary: string;
  key_facts: string[];
  sources: Array<{ title: string; url: string }>;
}

// 2. Anti-Prompt Injection & Content Sanitization
function sanitizeClaim(rawText: string): string {
  if (!rawText) return "";

  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|prior)\s+(instructions|prompts|directives)/gi,
    /system\s+override/gi,
    /you\s+are\s+now\s+(in\s+)?(developer\s+mode|dan|unrestricted)/gi,
    /disregard\s+(all\s+)?(guardrails|guidelines|safety\s+filters)/gi,
    /act\s+as\s+an\s+unfiltered\s+ai/gi,
    /forget\s+everything\s+you\s+were\s+told/gi,
    /output\s+only\s+(true|false|misleading|unverified)/gi,
  ];

  let cleaned = rawText;
  for (const pattern of injectionPatterns) {
    cleaned = cleaned.replace(pattern, "[CLEANSED_INJECTION_ATTEMPT]");
  }

  // Strip excessive invisible unicode / control characters
  cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, " ").trim();

  return cleaned;
}

// Compute SHA-256 in standard Web Crypto API (Deno supported)
async function computeSha256(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: VerifyRequestBody = await req.json();
    const rawClaimText = (body.claimText || "").trim();
    const imageBase64 = body.imageBase64;
    const imageMimeType = body.imageMimeType || "image/jpeg";
    const inputType = body.inputType || "text";
    const userId = body.userId || null;

    if (!rawClaimText && !imageBase64) {
      return new Response(
        JSON.stringify({ error: "Please provide either claim text, a URL, or an image to verify." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize input against prompt injection
    const sanitizedClaim = sanitizeClaim(rawClaimText);
    const normalizedClaim = sanitizedClaim.toLowerCase();
    const queryHash = await computeSha256(normalizedClaim || (imageBase64 ? imageBase64.slice(0, 100) : "empty"));

    // Supabase client initialization
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Exact Deduplication Caching (Within 7 Days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: cachedMatch, error: cacheErr } = await supabase
      .from("claims")
      .select("*")
      .eq("query_hash", queryHash)
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!cacheErr && cachedMatch) {
      return new Response(
        JSON.stringify({
          ...cachedMatch,
          isCached: true,
          cacheTimestamp: cachedMatch.created_at,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 4. Real-time Gemini 2.5 Flash Grounding Integration
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    // Build prompt contents
    const promptParts: any[] = [];

    if (imageBase64) {
      promptParts.push({
        inlineData: {
          mimeType: imageMimeType,
          data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ""),
        },
      });
    }

    const verificationPrompt = `
You are Check It, the premier investigative fact-checking verification intelligence engine.
Analyze the following claim for factual accuracy by cross-referencing real-time web sources via Google Search.

CLAIM TO VERIFY:
"""
${sanitizedClaim || "Analyze the attached image for false claims, digital manipulation, or misleading viral narratives."}
"""

VERIFICATION CRITERIA:
1. Verdict MUST be one of:
   - "TRUE": Substantively backed by established factual consensus, credible reporting, or authoritative data.
   - "FALSE": Factually refuted, debunked by consensus, or scientifically impossible.
   - "MISLEADING": Contains a kernel of truth but omits vital context, exaggerates, or misrepresents facts.
   - "UNVERIFIED": Insufficient conclusive evidence exists currently to confirm or refute.
2. Confidence MUST be an integer between 0 and 100 indicating certainty based on available authoritative sources.
3. Summary MUST be an objective, neutral paragraph explaining the core finding.
4. Key Facts MUST be 3 to 5 concise bullet points highlighting verifiable evidence and counter-evidence.
5. Provide credible sources that corroborate this finding.
`;

    promptParts.push({ text: verificationPrompt });

    // Call Gemini 2.5 Flash with Search Grounding & Structured Output
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptParts,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verdict: {
              type: Type.STRING,
              enum: ["TRUE", "FALSE", "MISLEADING", "UNVERIFIED"],
            },
            confidence: {
              type: Type.INTEGER,
            },
            summary: {
              type: Type.STRING,
            },
            key_facts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            sources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING },
                },
                required: ["title", "url"],
              },
            },
          },
          required: ["verdict", "confidence", "summary", "key_facts", "sources"],
        },
      },
    });

    const rawResponseText = response.text || "{}";
    let parsed: FactCheckResult;

    try {
      parsed = JSON.parse(rawResponseText);
    } catch {
      const cleanedJson = rawResponseText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleanedJson);
    }

    // 5. Extract Authentic Sources from Search Grounding Metadata
    const groundingChunks: GroundingChunk[] =
      (response.candidates?.[0] as any)?.groundingMetadata?.groundingChunks || [];

    const liveGroundingSources: Array<{ title: string; url: string }> = [];

    for (const chunk of groundingChunks) {
      if (chunk.web?.uri) {
        liveGroundingSources.push({
          title: chunk.web.title || new URL(chunk.web.uri).hostname,
          url: chunk.web.uri,
        });
      }
    }

    // Merge generated sources + live grounding sources (deduplicating by URL)
    const combinedSourcesMap = new Map<string, string>();

    liveGroundingSources.forEach((s) => {
      if (s.url && !combinedSourcesMap.has(s.url)) {
        combinedSourcesMap.set(s.url, s.title);
      }
    });

    (parsed.sources || []).forEach((s) => {
      if (s.url && !combinedSourcesMap.has(s.url)) {
        combinedSourcesMap.set(s.url, s.title);
      }
    });

    const finalSources = Array.from(combinedSourcesMap.entries()).map(([url, title]) => ({
      url,
      title,
    }));

    // 6. Store in Database
    const claimRecord = {
      claim_text: sanitizedClaim || "Media Verification Query",
      image_url: null,
      input_type: inputType,
      verdict: parsed.verdict || "UNVERIFIED",
      confidence: Math.min(100, Math.max(0, parsed.confidence || 75)),
      summary: parsed.summary || "No automated summary could be synthesized.",
      key_facts: parsed.key_facts || [],
      sources: finalSources.length > 0 ? finalSources : [{ title: "Google Search Fact Index", url: "https://www.google.com" }],
      query_hash: queryHash,
      user_id: userId,
      is_admin_overridden: false,
      upvotes: 0,
    };

    const { data: insertedClaim, error: insertErr } = await supabase
      .from("claims")
      .insert(claimRecord)
      .select("*")
      .single();

    if (insertErr) {
      console.error("Database insert error:", insertErr);
      return new Response(JSON.stringify({ ...claimRecord, id: crypto.randomUUID(), created_at: new Date().toISOString() }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        ...insertedClaim,
        isCached: false,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("verify-claim function error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "An unexpected error occurred during fact verification.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});