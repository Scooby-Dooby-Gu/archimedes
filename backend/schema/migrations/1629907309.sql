DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1629907309'::bigint THEN
    
    RAISE LOG 'Migrating 1629907309.sql';
drop extension if exists "pg_stat_statements";

    COMMENT ON SCHEMA private IS '1629907309';
  END IF;
END;
$do$;
