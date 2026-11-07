DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1626366032'::bigint THEN
    
    RAISE LOG 'Migrating 1626366032.sql';
alter table "public"."goals" add column "tagline" text;

    COMMENT ON SCHEMA private IS '1626366032';
  END IF;
END;
$do$;
