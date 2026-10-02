-- ======================================================================================
-- CHECK IT AI - DATABASE SCHEMA, TRIGGERS, SECURITY FUNCTIONS & ROW LEVEL SECURITY
-- ======================================================================================

-- 1. Create Tables

-- PROFILES: Linked directly to Supabase Auth users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CLAIMS: Core repository for fact-checked queries & verdicts
CREATE TABLE IF NOT EXISTS public.claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_text TEXT NOT NULL,
    image_url TEXT,
    input_type TEXT DEFAULT 'text' CHECK (input_type IN ('text', 'link', 'media')),
    verdict TEXT NOT NULL CHECK (verdict IN ('TRUE', 'FALSE', 'MISLEADING', 'UNVERIFIED')),
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    summary TEXT,
    key_facts JSONB NOT NULL DEFAULT '[]'::jsonb,
    sources JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of { title: string, url: string }
    query_hash TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_admin_overridden BOOLEAN NOT NULL DEFAULT FALSE,
    upvotes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- COMMUNITY FLAGS: Human crowdsourcing & misinformation flags
CREATE TABLE IF NOT EXISTS public.community_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    flag_type TEXT NOT NULL, -- e.g., 'OUTDATED', 'BIASED_SOURCE', 'MISSING_CONTEXT', 'FABRICATED'
    reasoning TEXT,
    upvotes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AUDIT LOGS: Immutable HITL (Human-In-The-Loop) modification trail
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    old_verdict TEXT,
    new_verdict TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------------------
-- 2. Performance Indexes
-- --------------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_claims_query_hash_created ON public.claims(query_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claims_user_id ON public.claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_verdict ON public.claims(verdict);
CREATE INDEX IF NOT EXISTS idx_community_flags_claim_id ON public.community_flags(claim_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_claim_id ON public.audit_logs(claim_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- --------------------------------------------------------------------------------------
-- 3. Prevent RLS Recursion (CRITICAL BUG FIX)
-- --------------------------------------------------------------------------------------
-- This security definer function queries the profiles table directly with elevated rights,
-- bypassing RLS to eliminate infinite recursive checks when evaluating admin policies.
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = user_id AND role = 'admin'
    );
$$;

-- --------------------------------------------------------------------------------------
-- 4. Automated User Profile Trigger (PREVENTS NULL PROFILE BUGS)
-- --------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------------------------------------
-- 5. Row Level Security (RLS) Configuration
-- --------------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Profiles are viewable by owner or admin"
    ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = id
        OR public.is_admin(auth.uid())
    );

CREATE POLICY "Users can update own profile, Admins can update any"
    ON public.profiles
    FOR UPDATE
    USING (
        auth.uid() = id
        OR public.is_admin(auth.uid())
    );

-- CLAIMS POLICIES
CREATE POLICY "Anyone can view claims"
    ON public.claims
    FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert claims"
    ON public.claims
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Only admins can update claims"
    ON public.claims
    FOR UPDATE
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete claims"
    ON public.claims
    FOR DELETE
    USING (public.is_admin(auth.uid()));

-- COMMUNITY FLAGS POLICIES
CREATE POLICY "Anyone can view community flags"
    ON public.community_flags
    FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can submit flags"
    ON public.community_flags
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND auth.uid() = user_id
    );

CREATE POLICY "Authenticated users can update flags or upvotes"
    ON public.community_flags
    FOR UPDATE
    USING (
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete own flags, Admins can delete any"
    ON public.community_flags
    FOR DELETE
    USING (
        auth.uid() = user_id
        OR public.is_admin(auth.uid())
    );

-- AUDIT LOGS POLICIES
CREATE POLICY "Only admins can view audit logs"
    ON public.audit_logs
    FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can insert audit logs"
    ON public.audit_logs
    FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

-- --------------------------------------------------------------------------------------
-- 6. Helper Function: Atomic Claim Upvote
-- --------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_claim_upvotes(target_claim_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE public.claims
    SET upvotes = upvotes + 1
    WHERE id = target_claim_id
    RETURNING upvotes INTO new_count;
    
    RETURN new_count;
END;
$$;