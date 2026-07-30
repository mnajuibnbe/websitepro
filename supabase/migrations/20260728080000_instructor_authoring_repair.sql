-- Repair Phase 4 installations that stopped at an existing-policy error.
-- Enum additions must commit before a later transaction references the value.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'instructor';


-- The function and data repair is intentionally in the next migration so this
-- enum value is committed before PostgreSQL parses statements that use it.
