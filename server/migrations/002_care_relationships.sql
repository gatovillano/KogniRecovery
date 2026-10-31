-- =====================================================
-- 002_care_relationships.sql
-- Vínculo paciente-centro, asignaciones y invitaciones.
-- =====================================================

CREATE TABLE IF NOT EXISTS organization_patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'invited'
        CHECK (status IN ('invited', 'active', 'discharged', 'left')),
    enrolled_at TIMESTAMPTZ,
    discharged_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_organization_patient UNIQUE (organization_id, patient_id)
);

CREATE INDEX IF NOT EXISTS idx_org_patients_org_status
    ON organization_patients(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_org_patients_patient
    ON organization_patients(patient_id);

CREATE TABLE IF NOT EXISTS care_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_patient_id UUID NOT NULL
        REFERENCES organization_patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'primary'
        CHECK (role IN ('primary', 'team')),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'ended')),
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    ended_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_care_assignments_patient_professional
    ON care_assignments(organization_patient_id, professional_id, status);
CREATE INDEX IF NOT EXISTS idx_care_assignments_professional_status
    ON care_assignments(professional_id, status);

CREATE TABLE IF NOT EXISTS patient_enrollment_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_email VARCHAR(320) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_patient_invite_token UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_patient_invites_org_status
    ON patient_enrollment_invites(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_patient_invites_email
    ON patient_enrollment_invites(lower(patient_email));

COMMENT ON TABLE organization_patients IS
    'Paciente vinculado a un centro. Aceptar el vínculo no implica compartir datos clínicos.';
COMMENT ON TABLE care_assignments IS
    'Asignación de un terapeuta a un paciente dentro de un centro.';
COMMENT ON TABLE patient_enrollment_invites IS
    'Invitaciones para vincular un paciente existente o nuevo a un centro.';
