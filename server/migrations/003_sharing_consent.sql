-- =====================================================
-- 003_sharing_consent.sql
-- Consentimiento granular, versionado y revocable.
-- =====================================================

CREATE TABLE IF NOT EXISTS consent_policy_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(20) NOT NULL UNIQUE,
    locale VARCHAR(10) NOT NULL DEFAULT 'es-CL',
    document_hash VARCHAR(64) NOT NULL,
    document_text TEXT NOT NULL,
    categories JSONB NOT NULL,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sharing_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    grantee_type VARCHAR(20) NOT NULL
        CHECK (grantee_type IN ('organization', 'professional')),
    grantee_id UUID NOT NULL,
    purpose VARCHAR(20) NOT NULL DEFAULT 'treatment'
        CHECK (purpose IN ('treatment', 'safety')),
    policy_version_id UUID NOT NULL
        REFERENCES consent_policy_versions(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'granted'
        CHECK (status IN ('granted', 'revoked', 'expired')),
    history_days INTEGER CHECK (history_days IS NULL OR history_days > 0),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    revocation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sharing_consents_patient
    ON sharing_consents(patient_id, organization_id, status);
CREATE INDEX IF NOT EXISTS idx_sharing_consents_grantee
    ON sharing_consents(organization_id, grantee_type, grantee_id, status);
CREATE INDEX IF NOT EXISTS idx_sharing_consents_expiry
    ON sharing_consents(expires_at) WHERE status = 'granted';

-- Un solo consentimiento activo por paciente/destinatario/finalidad.
CREATE UNIQUE INDEX IF NOT EXISTS idx_sharing_consents_active
    ON sharing_consents(patient_id, organization_id, grantee_type, grantee_id, purpose)
    WHERE status = 'granted';

CREATE TABLE IF NOT EXISTS sharing_consent_categories (
    consent_id UUID NOT NULL REFERENCES sharing_consents(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    detail_level VARCHAR(20) NOT NULL DEFAULT 'summary'
        CHECK (detail_level IN ('aggregate', 'summary', 'detailed', 'full')),
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (consent_id, category)
);

CREATE INDEX IF NOT EXISTS idx_sharing_consent_categories_category
    ON sharing_consent_categories(category, enabled);

-- Historial append-only. No se actualiza ni se borra.
CREATE TABLE IF NOT EXISTS sharing_consent_events (
    id BIGSERIAL PRIMARY KEY,
    consent_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    event_type VARCHAR(30) NOT NULL
        CHECK (event_type IN ('granted', 'updated', 'revoked', 'expired', 'renewed')),
    snapshot JSONB NOT NULL,
    actor_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sharing_consent_events_patient
    ON sharing_consent_events(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sharing_consent_events_consent
    ON sharing_consent_events(consent_id, created_at DESC);

COMMENT ON TABLE consent_policy_versions IS
    'Versión exacta del texto de consentimiento mostrado al paciente.';
COMMENT ON TABLE sharing_consents IS
    'Consentimiento del paciente para compartir categorías clínicas con un centro o profesional.';
COMMENT ON TABLE sharing_consent_categories IS
    'Categorías y nivel de detalle habilitados dentro de un consentimiento.';
COMMENT ON TABLE sharing_consent_events IS
    'Historial inmutable de otorgamiento, actualización y revocación de consentimientos.';
COMMENT ON COLUMN sharing_consents.grantee_type IS
    'organization = equipo de tratamiento; professional = una persona concreta.';
COMMENT ON COLUMN sharing_consents.history_days IS
    'Ventana de historia compartida. NULL significa todo el historial disponible.';
