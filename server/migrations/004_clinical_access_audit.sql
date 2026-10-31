-- =====================================================
-- 004_clinical_access_audit.sql
-- Auditoría append-only de lecturas clínicas.
-- =====================================================

CREATE TABLE IF NOT EXISTS clinical_access_log (
    id BIGSERIAL PRIMARY KEY,
    actor_id UUID NOT NULL,
    actor_role VARCHAR(30) NOT NULL,
    organization_id UUID NOT NULL,
    patient_id UUID,
    consent_id UUID,
    action VARCHAR(30) NOT NULL
        CHECK (action IN ('view', 'list', 'export', 'break_glass', 'denied')),
    resource_type VARCHAR(50) NOT NULL,
    resource_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
    purpose VARCHAR(20) NOT NULL
        CHECK (purpose IN ('treatment', 'safety', 'break_glass')),
    success BOOLEAN NOT NULL,
    denial_reason VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    request_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinical_access_patient
    ON clinical_access_log(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_access_actor
    ON clinical_access_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_access_org
    ON clinical_access_log(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_access_denied
    ON clinical_access_log(organization_id, created_at DESC)
    WHERE success = FALSE;

COMMENT ON TABLE clinical_access_log IS
    'Registro inmutable de accesos a datos clínicos. Nunca contiene valores clínicos.';
COMMENT ON COLUMN clinical_access_log.resource_ids IS
    'IDs de los registros leídos, no su contenido.';
COMMENT ON COLUMN clinical_access_log.denial_reason IS
    'Motivo técnico de la denegación, sin datos del paciente.';
