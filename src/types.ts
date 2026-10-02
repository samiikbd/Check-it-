export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export type VerdictType = 'TRUE' | 'FALSE' | 'MISLEADING' | 'PARTIALLY_TRUE' | 'UNVERIFIED';

export type InputMode = 'text' | 'link' | 'media';

export interface ClaimSource {
  title: string;
  url: string;
}

export interface Claim {
  id: string;
  claim_text: string;
  query: string;
  input_type?: InputMode | string;
  verdict: VerdictType;
  confidence: number;
  summary: string;
  key_facts: string[];
  sources: ClaimSource[];
  query_hash: string;
  user_id: string | null;
  is_admin_overridden?: boolean;
  admin_override?: boolean;
  upvotes?: number;
  created_at: string;
  isCached?: boolean;
  image_url?: string;
}

export interface CommunityFlag {
  id: string;
  claim_id: string;
  user_id: string;
  user_email?: string;
  flag_type: 'MISSING_CONTEXT' | 'FABRICATED' | 'OUTDATED' | 'BIASED_SOURCE' | 'OTHER' | string;
  reason?: string;
  reasoning?: string;
  details?: string;
  upvotes?: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  claim_id: string;
  claim_text?: string;
  admin_id: string;
  admin_email: string;
  old_verdict?: string | VerdictType;
  previous_verdict?: string | VerdictType;
  new_verdict: VerdictType;
  reason: string;
  created_at: string;
}

export interface VerificationRequest {
  claimText?: string;
  imageBase64?: string;
  imageMimeType?: string;
  inputType: InputMode;
  userId?: string | null;
}
