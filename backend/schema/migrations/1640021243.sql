DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1640021243'::bigint THEN
    
    RAISE LOG 'Migrating 1640021243.sql';
drop extension if exists "pg_stat_statements";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.generate_lesson_glossary()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  new.glossary_html = (
    SELECT array_agg(regexp_matches[1]) 
    FROM regexp_matches(new.content_html, '<figure[^>]*?type="definition"[^>]*?>.*?</figure>', 'ig')
  );

  RETURN new;
END
$function$
;

UPDATE submissions
SET ambition_id = ref::integer
WHERE type = 'ambitionQuestion'
AND ambition_id is null;

UPDATE submissions
SET ambition_id = ref::integer
WHERE type = 'ambition'
AND ambition_id is null;

UPDATE submissions
SET goal_id = ref::integer
WHERE type = 'question'
AND goal_id is null;

UPDATE submissions
SET goal_id = ref::integer
WHERE type = 'goal'
AND goal_id is null;

    COMMENT ON SCHEMA private IS '1640021243';
  END IF;
END;
$do$;
