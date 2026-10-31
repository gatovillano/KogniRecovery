-- =====================================================
-- 009_patient_rights.sql
-- Solicitudes de borrado de datos y base para notificaciones.
-- =====================================================

CREATE TABLE IF NOT EXISTS data_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'requested'
        CHECK (status IN ('requested', 'in_progress', 'completed', 'rejected')),
    requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_deletion_patient
    ON data_deletion_requests(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_data_deletion_org
    ON data_deletion_requests(organization_id, created_at DESC);
