DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1631893580'::bigint THEN
    
    RAISE LOG 'Migrating 1631893580.sql';
set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_total_reply_count_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
   _id int;
BEGIN
   CASE TG_OP
      WHEN 'INSERT', 'UPDATE' THEN
         _id := NEW.discussion_id;
      WHEN 'DELETE' THEN
         _id := OLD.discussion_id;
   END CASE;

   UPDATE discussions SET reply_count = (
     SELECT count(*) 
     FROM replies 
     WHERE discussion_id = _id
   ), last_reply_at = NOW()
   WHERE id = _id;

   RETURN NULL;
END
$function$
;

    COMMENT ON SCHEMA private IS '1631893580';
  END IF;
END;
$do$;
