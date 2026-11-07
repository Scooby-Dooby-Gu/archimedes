DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1634574441'::bigint THEN
    
    RAISE LOG 'Migrating 1634574441.sql';
alter table "public"."lessons" drop column "summary_html";

alter table "public"."lessons" add column "glossary_terms" text[] default ARRAY[]::text[];

drop extension if exists "pg_stat_statements";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.generate_lesson_glossary()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  new.glossary_terms = (
    SELECT array_agg(regexp_matches[1]) 
    FROM regexp_matches(new.content_html, '<figure[^>]*?type="definition"[^>]*?>.*?</figure>', 'ig')
  );

  RETURN new;
END
$function$
;

CREATE TRIGGER generate_lesson_glossary_trigger BEFORE INSERT OR UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION generate_lesson_glossary();

UPDATE lessons
SET glossary_terms = (SELECT array_agg(regexp_matches[1])
    FROM regexp_matches(content_html, '<figure[^>]*?type="definition"[^>]*?>.*?</figure>', 'ig'));

    COMMENT ON SCHEMA private IS '1634574441';
  END IF;
END;
$do$;
