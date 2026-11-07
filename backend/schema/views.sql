DROP VIEW IF EXISTS public.users CASCADE;
CREATE VIEW public.users AS SELECT id, name, email, avatar, avatar_sizes, phone_number, company_id, facebook_id, google_id, role, created_at, bio_html FROM private.users;
