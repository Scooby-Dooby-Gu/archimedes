DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1624976239'::bigint THEN
    
    RAISE LOG 'Migrating 1624976239.sql';
drop index if exists "public"."task_lookup";

alter table "public"."ambitions" add column "color" character varying(255);

alter table "public"."ambitions" add column "tagline" text;

CREATE INDEX task_lookup ON public.tasks USING btree (goal_id, visibility, "order", created_at);

    COMMENT ON SCHEMA private IS '1624976239';
  END IF;
END;
$do$;
