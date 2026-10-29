-- Enable pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trigram index on cases subject for high-speed similarity search
CREATE INDEX IF NOT EXISTS idx_cases_subject_trgm ON cases USING gin (subject gin_trgm_ops);

-- Append-only trigger for audit_events
CREATE OR REPLACE FUNCTION block_audit_events_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit events table is append-only. UPDATE and DELETE operations are forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_block_audit_events_modification ON audit_events;
CREATE TRIGGER trigger_block_audit_events_modification
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW
EXECUTE FUNCTION block_audit_events_modification();
