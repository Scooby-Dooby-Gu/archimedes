DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1624898482'::bigint THEN
    
    RAISE LOG 'Migrating 1624898482.sql';
drop index if exists "public"."ambitions_lookup";

drop index if exists "public"."ambitions_type_lookup";

drop index if exists "public"."goal_ambitions_lookup";

drop index if exists "public"."task_lookup";

alter table "public"."ambitions" alter column "type" drop default;

alter type "public"."ambition_type" rename to "ambition_type__old_version_to_be_dropped";

create type "public"."ambition_type" as enum ('initial', 'regular', 'hidden');

alter table "public"."ambitions" alter column type type "public"."ambition_type" using type::text::"public"."ambition_type";

alter table "public"."ambitions" alter column "type" set default 'initial'::ambition_type;

drop type "public"."ambition_type__old_version_to_be_dropped";

alter table "public"."ambitions" add column "previous_ambition_id" integer;

alter table "public"."ambitions" add column "question" jsonb;

drop extension if exists "pg_stat_statements";

CREATE INDEX task_lesson_lookup ON public.tasks USING btree (lesson_id);

CREATE INDEX task_video_lookup ON public.tasks USING btree (video_id);

CREATE INDEX ambitions_lookup ON public.ambitions USING btree ("order", created_at);

CREATE INDEX ambitions_type_lookup ON public.ambitions USING btree (type, "order", created_at);

CREATE INDEX goal_ambitions_lookup ON public.goal_ambitions USING btree (ambition_id, "order", created_at) INCLUDE (goal_id);

CREATE INDEX task_lookup ON public.tasks USING btree (goal_id, "order", created_at);

alter table "public"."ambitions" add constraint "ambitions_previous_ambition_id_fkey" FOREIGN KEY (previous_ambition_id) REFERENCES ambitions(id) ON DELETE SET NULL;

    COMMENT ON SCHEMA private IS '1624898482';
  END IF;
END;
$do$;
