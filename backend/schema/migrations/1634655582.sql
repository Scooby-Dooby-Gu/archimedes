DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1634655582'::bigint THEN
    
    RAISE LOG 'Migrating 1634655582.sql';
alter type "public"."task_type" rename to "task_type__old_version_to_be_dropped";

create type "public"."task_type" as enum ('lesson', 'video', 'link', 'discussion', 'game_challenge', 'youtube');

alter table "public"."tasks" alter column type type "public"."task_type" using type::text::"public"."task_type";

drop type "public"."task_type__old_version_to_be_dropped";


    COMMENT ON SCHEMA private IS '1634655582';
  END IF;
END;
$do$;
