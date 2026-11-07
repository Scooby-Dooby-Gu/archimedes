DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1640087543'::bigint THEN
    
    RAISE LOG 'Migrating 1640087543.sql';
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

    COMMENT ON SCHEMA private IS '1640087543';
  END IF;
END;
$do$;
