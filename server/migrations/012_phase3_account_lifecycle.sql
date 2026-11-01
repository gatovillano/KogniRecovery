-- =====================================================
-- 012_phase3_account_lifecycle.sql
-- Permite el estado 'deleted' para soft-delete de cuentas.
-- =====================================================
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users
  ADD CONSTRAINT users_status_check
  CHECK (status IN ('active', 'inactive', 'suspended', 'deleted'));
