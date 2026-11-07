DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1633349765'::bigint THEN
    
    RAISE LOG 'Migrating 1633349765.sql';
create or replace view "public"."users" as  SELECT users.id,
    users.name,
    users.email,
    users.avatar,
    users.avatar_sizes,
    users.phone_number,
    users.company_id,
    users.facebook_id,
    users.google_id,
    users.role,
    users.created_at,
    users.bio_html
   FROM private.users;

    COMMENT ON SCHEMA private IS '1633349765';
  END IF;
END;
$do$;
