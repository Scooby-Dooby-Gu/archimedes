DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1630421901'::bigint THEN
    
    RAISE LOG 'Migrating 1630421901.sql';
drop view if exists "public"."users";

alter table "private"."users" add column "invite_id" integer;

alter table "private"."users" add constraint "user_invite_id" FOREIGN KEY (invite_id) REFERENCES invites(id) ON DELETE SET NULL;

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

    COMMENT ON SCHEMA private IS '1630421901';
  END IF;
END;
$do$;
