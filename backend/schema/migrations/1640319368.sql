DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1640319368'::bigint THEN
    
    RAISE LOG 'Migrating 1640319368.sql';
alter table "public"."submissions" add column "is_skipped" boolean default false;

    COMMENT ON SCHEMA private IS '1640319368';
  END IF;
END;
$do$;
