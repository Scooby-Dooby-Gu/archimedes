DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1794137931'::bigint THEN
    
    RAISE LOG 'Migrating 1794137931.sql';
CREATE TABLE IF NOT EXISTS private.rate_limits(
  key VARCHAR(255) PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  count INTEGER NOT NULL DEFAULT 0
);

    COMMENT ON SCHEMA private IS '1794137931';
  END IF;
END;
$do$;
