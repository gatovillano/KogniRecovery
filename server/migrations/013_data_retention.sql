-- SEC-PHASE2: políticas de retención de datos (worker run-retention.ts).

CREATE TABLE IF NOT EXISTS data_retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type text NOT NULL UNIQUE,
  retention_days integer NOT NULL DEFAULT 90,
  auto_delete boolean NOT NULL DEFAULT true,
  anonymize_instead boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

INSERT INTO data_retention_policies (data_type, retention_days) VALUES
  ('messages', 180),
  ('conversations', 180),
  ('llm_logs', 90),
  ('context_history', 90),
  ('checkins', 365),
  ('cravings', 365)
ON CONFLICT (data_type) DO NOTHING;
