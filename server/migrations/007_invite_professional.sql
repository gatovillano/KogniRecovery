-- =====================================================
-- 007_invite_professional.sql
-- La invitación de paciente puede indicar el terapeuta
-- asignado. Se guarda en la propia invitación (no se deriva).
-- =====================================================

ALTER TABLE patient_enrollment_invites
  ADD COLUMN IF NOT EXISTS professional_id UUID
    REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_patient_invites_professional
  ON patient_enrollment_invites(professional_id, status);
