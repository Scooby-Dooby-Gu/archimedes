DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1628613801'::bigint THEN
    
    RAISE LOG 'Migrating 1628613801.sql';
drop extension if exists "pg_stat_statements";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.assign_lesson_achievements()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
   passed_lesson_count integer;
   passed_goals_count integer;
   user_company_id integer;
   best_user_id integer;
BEGIN
  IF new.type = 'lesson' THEN
    SELECT count(*) FROM submissions WHERE user_id=new.user_id and is_complete and type='lesson' INTO passed_lesson_count;
    IF passed_lesson_count = 1 THEN  
      INSERT INTO user_achievements(user_id, achievement_id) VALUES(new.user_id, (SELECT id FROM achievements where slug='lesson_1')) ON CONFLICT DO NOTHING;
    END IF;
    IF passed_lesson_count = 10 THEN
      INSERT INTO user_achievements(user_id, achievement_id) VALUES(new.user_id, (SELECT id FROM achievements where slug='lesson_2')) ON CONFLICT DO NOTHING;
    END IF;
    IF passed_lesson_count = 30 THEN
      INSERT INTO user_achievements(user_id, achievement_id) VALUES(new.user_id, (SELECT id FROM achievements where slug='lesson_3')) ON CONFLICT DO NOTHING;
    END IF;
    IF passed_lesson_count = 3 THEN
      INSERT INTO user_achievements(user_id, achievement_id) VALUES(new.user_id, (SELECT id FROM achievements where slug='unlock_game')) ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  IF new.type = 'goal' THEN
    SELECT count(*) FROM submissions WHERE user_id=new.user_id and is_complete and type='goal' INTO passed_goals_count;
    IF passed_goals_count = 2 THEN  
      INSERT INTO user_achievements(user_id, achievement_id) VALUES(new.user_id, (SELECT id FROM achievements where slug='unlock_videos')) ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  IF new.type = 'ambition' THEN
    INSERT INTO user_achievements(user_id, achievement_id) VALUES(new.user_id, (SELECT id FROM achievements where slug='unlock_courses')) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NULL;
END;
$function$
;

DELETE FROM achievements where slug='course_1';
DELETE FROM achievements where slug='course_2';
DELETE FROM achievements where slug='course_3';
DELETE FROM achievements where slug='most_educated_in_company';

INSERT INTO achievements(slug, name, summary, icon) VALUES('unlock_game', 'Unlock: Paper chase', 'Put it into practice. You''re ready to play Paper Chase', '/assets/images/icons/play.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('unlock_videos', 'Unlock: Investing experts', 'Learn from the best. Hear what experts have to say.', '/assets/images/icons/experts.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('unlock_courses', 'Unlock: Free play', 'Nice job! Go your own way. Explore all of our lessons.', '/assets/images/icons/explorer.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;


INSERT INTO user_achievements(user_id, achievement_id)
SELECT q.user_id, (SELECT id FROM achievements where slug='unlock_game')
FROM 
(SELECT user_id, count(*) from submissions where type='lesson' group by 1 having count(*) > 2) q
ON CONFLICT DO NOTHING;

INSERT INTO user_achievements(user_id, achievement_id)
SELECT q.user_id, (SELECT id FROM achievements where slug='unlock_videos')
FROM 
(SELECT user_id, count(*) from submissions where type='goal' group by 1 having count(*) > 1) q
ON CONFLICT DO NOTHING;

INSERT INTO user_achievements(user_id, achievement_id)
SELECT q.user_id, (SELECT id FROM achievements where slug='unlock_courses')
FROM 
(SELECT user_id, count(*) from submissions where type='ambition' group by 1) q
ON CONFLICT DO NOTHING;


    COMMENT ON SCHEMA private IS '1628613801';
  END IF;
END;
$do$;
