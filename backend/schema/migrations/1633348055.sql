DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1633348055'::bigint THEN
    
    RAISE LOG 'Migrating 1633348055.sql';
drop view if exists "public"."users";

alter table "private"."users" add column "bio_html" text;

alter table "public"."lessons" drop column "author_information_html";

drop extension if exists "pg_stat_statements";

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
    users.created_at
   FROM private.users;

    COMMENT ON SCHEMA private IS '1633348055';
  END IF;
END;
$do$;
