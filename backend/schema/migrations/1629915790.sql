DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1629915790'::bigint THEN
    
    RAISE LOG 'Migrating 1629915790.sql';
alter table "public"."embeds" add column "type" character varying(255);

alter table "public"."embeds" alter column "url" drop not null;

CREATE UNIQUE INDEX embeds_url_key ON public.embeds USING btree (url);

alter table "public"."embeds" add constraint "embeds_url_key" UNIQUE using index "embeds_url_key";

    COMMENT ON SCHEMA private IS '1629915790';
  END IF;
END;
$do$;
