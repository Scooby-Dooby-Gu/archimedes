DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1634656376'::bigint THEN
    
    RAISE LOG 'Migrating 1634656376.sql';
alter type "public"."submission_type" rename to "submission_type__old_version_to_be_dropped";

create type "public"."submission_type" as enum ('lesson', 'video', 'link', 'question', 'goal', 'ambition', 'ambitionQuestion', 'promo', 'youtube');

alter table "public"."submissions" alter column type type "public"."submission_type" using type::text::"public"."submission_type";

drop type "public"."submission_type__old_version_to_be_dropped";

    COMMENT ON SCHEMA private IS '1634656376';
  END IF;
END;
$do$;
