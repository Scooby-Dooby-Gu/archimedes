DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1628787343'::bigint THEN
    
    RAISE LOG 'Migrating 1628787343.sql';
drop view if exists "public"."users";

alter table "private"."users" alter column "role" drop default;

alter type "public"."user_role" rename to "user_role__old_version_to_be_dropped";

create type "public"."user_role" as enum ('guest', 'demo', 'user', 'visitor', 'writer', 'moderator', 'admin', 'manager');

alter table "private"."users" alter column role type "public"."user_role" using role::text::"public"."user_role";

alter table "private"."users" alter column "role" set default 'user'::user_role;

drop type "public"."user_role__old_version_to_be_dropped";

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

    COMMENT ON SCHEMA private IS '1628787343';
  END IF;
END;
$do$;
