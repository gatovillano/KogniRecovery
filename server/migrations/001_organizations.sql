-- =====================================================
-- 001_organizations.sql
-- Centros de salud mental, membresías y credenciales.
-- =====================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(255),
    tax_id VARCHAR(50),
    country CHAR(2) NOT NULL DEFAULT 'CL',
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Santiago',
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'suspended', 'closed')),
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);

CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL
        CHECK (role IN ('org_admin', 'clinical_lead', 'therapist', 'auditor')),
    status VARCHAR(20) NOT NULL DEFAULT 'invited'
        CHECK (status IN ('invited', 'active', 'suspended', 'removed')),
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_organization_member UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org_status
    ON organization_members(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_org_members_user
    ON organization_members(user_id);

CREATE TABLE IF NOT EXISTS professional_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    license_number VARCHAR(100) NOT NULL,
    license_country CHAR(2) NOT NULL DEFAULT 'CL',
    specialty VARCHAR(100),
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    expires_at DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_professional_license
        UNIQUE (organization_id, user_id, license_number)
);

CREATE INDEX IF NOT EXISTS idx_professional_credentials_user
    ON professional_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_credentials_org_status
    ON professional_credentials(organization_id, verification_status);

COMMENT ON TABLE organizations IS
    'Centros de salud mental que operan el panel de terapeutas.';
COMMENT ON TABLE organization_members IS
    'Membresía y rol de un usuario dentro de una organización.';
COMMENT ON COLUMN organization_members.role IS
    'org_admin administra el centro; clinical_lead supervisa; therapist atiende; auditor solo ve metadatos.';
COMMENT ON TABLE professional_credentials IS
    'Credenciales profesionales verificadas por organización.';
