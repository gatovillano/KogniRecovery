-- =====================================================
-- 005_alerts_and_notes.sql
-- Alertas clínicas y notas privadas del terapeuta.
-- =====================================================

CREATE TABLE IF NOT EXISTS clinical_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source VARCHAR(30) NOT NULL
        CHECK (source IN ('checkin', 'chatbot', 'self_report', 'clinician')),
    severity VARCHAR(20) NOT NULL
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'acknowledged', 'escalated', 'closed', 'false_positive')),
    summary TEXT NOT NULL,
    source_ref UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ,
    escalated_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinical_alerts_org_status
    ON clinical_alerts(organization_id, status, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_alerts_patient
    ON clinical_alerts(patient_id, created_at DESC);

CREATE TABLE IF NOT EXISTS clinical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_encrypted BYTEA NOT NULL,
    visibility VARCHAR(20) NOT NULL DEFAULT 'care_team'
        CHECK (visibility IN ('private', 'care_team')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient
    ON clinical_notes(organization_id, patient_id, created_at DESC)
    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clinical_notes_author
    ON clinical_notes(author_id, created_at DESC);

COMMENT ON TABLE clinical_alerts IS
    'Alertas de riesgo generadas por check-ins, chatbot o autoreporte.';
COMMENT ON TABLE clinical_notes IS
    'Notas del terapeuta, cifradas y separadas de los datos compartidos por el paciente.';
