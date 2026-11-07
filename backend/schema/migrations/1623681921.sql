DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1623681921'::bigint THEN
    
    RAISE LOG 'Migrating 1623681921.sql';
alter table "public"."goals" add column "afterword_html" text;

alter table "public"."goals" add column "cta" character varying(255);

    COMMENT ON SCHEMA private IS '1623681921';
  END IF;
END;
$do$;
