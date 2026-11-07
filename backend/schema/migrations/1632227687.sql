DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1632227687'::bigint THEN
    
    RAISE LOG 'Migrating 1632227687.sql';
alter table "public"."tasks" add column "promo_cta" character varying(255);
alter table "public"."tasks" add column "promo_url" character varying(255);

alter table "public"."tasks" add column "promo_image" text;

alter table "public"."tasks" add column "promo_image_sizes" jsonb;

    COMMENT ON SCHEMA private IS '1632227687';
  END IF;
END;
$do$;
