DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1626366033'::bigint THEN
    
    RAISE LOG 'Migrating 1626366033.sql';

    UPDATE tasks set description = lessons.duration || ' minute read'
    FROM lessons
    WHERE lessons.id = tasks.lesson_id
      AND (tasks.description is null or tasks.description = '');

    COMMENT ON SCHEMA private IS '1626366033';
  END IF;
END;
$do$;
