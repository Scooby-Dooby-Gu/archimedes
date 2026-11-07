DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1631011423'::bigint THEN
    
    RAISE LOG 'Migrating 1631011423.sql';
alter table "public"."embeds" alter column "image" set data type text using "image"::text;

    COMMENT ON SCHEMA private IS '1631011423';
  END IF;
END;
$do$;
