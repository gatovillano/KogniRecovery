-- =====================================================
-- 008_therapist_invites.sql
-- Invitaciones a terapeutas/roles de centro.
--
-- El org_admin invita por email; el profesional autenticado
-- acepta con el token, activando su membresía (organization_members)
-- con el rol indicado.
-- =====================================================

CREATE TABLE IF NOT EXISTS therapist_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(320) NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    role VARCHAR(30) NOT NULL
        CHECK (role IN ('org_admin', 'clinical_lead', 'therapist', 'auditor')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_therapist_invites_org_status
    ON therapist_invites(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_therapist_invites_email
    ON therapist_invites(lower(email));
