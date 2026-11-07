DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1624884753'::bigint THEN
    
    RAISE LOG 'Migrating 1624884753.sql';
drop index if exists "public"."ambitions_lookup";

drop index if exists "public"."ambitions_type_lookup";

drop index if exists "public"."goal_ambitions_lookup";

drop index if exists "public"."task_lookup";

CREATE INDEX ambitions_lookup ON public.ambitions USING btree ("order", created_at);

CREATE INDEX ambitions_type_lookup ON public.ambitions USING btree (type, "order", created_at);

CREATE INDEX goal_ambitions_lookup ON public.goal_ambitions USING btree (ambition_id, "order", created_at) INCLUDE (goal_id);

CREATE INDEX task_lookup ON public.tasks USING btree (goal_id, "order", created_at);

    COMMENT ON SCHEMA private IS '1624884753';
  END IF;
END;
$do$;
