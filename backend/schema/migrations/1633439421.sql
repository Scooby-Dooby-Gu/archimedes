DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1633439421'::bigint THEN
    
    RAISE LOG 'Migrating 1633439421.sql';
alter table "public"."videos" add column "footer_html" text;

    COMMENT ON SCHEMA private IS '1633439421';
  END IF;
END;
$do$;
