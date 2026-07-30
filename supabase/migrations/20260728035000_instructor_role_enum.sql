-- PostgreSQL must commit a new enum value before later migrations can use it.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'instructor';
