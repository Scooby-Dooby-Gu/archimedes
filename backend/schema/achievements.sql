
CREATE OR REPLACE FUNCTION assign_discussion_achievements()
  RETURNS trigger AS
$BODY$
DECLARE
  discussion_count integer;
  reply_count integer;
BEGIN
  SELECT count(*) FROM discussions WHERE user_id=new.user_id INTO discussion_count;
  SELECT count(*) FROM replies WHERE user_id=new.user_id INTO reply_count;
  IF reply_count + discussion_count = 1 THEN  
    INSERT INTO user_achievements(user_id, achievement_id) VALUES(new.user_id, (SELECT id FROM achievements where slug='discussion_1')) ON CONFLICT DO NOTHING;
  END IF;
  IF reply_count + discussion_count = 5 THEN
    INSERT INTO user_achievements(user_id, achievement_id) VALUES(new.user_id, (SELECT id FROM achievements where slug='discussion_2')) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NULL;
END;
$BODY$
LANGUAGE plpgsql;


CREATE TRIGGER assign_discussion_achievements
AFTER INSERT OR DELETE ON discussions
FOR EACH ROW EXECUTE PROCEDURE assign_discussion_achievements();

CREATE TRIGGER assign_reply_achievements
AFTER INSERT OR DELETE ON replies
FOR EACH ROW EXECUTE PROCEDURE assign_discussion_achievements();




CREATE OR REPLACE FUNCTION assign_lesson_achievements()
  RETURNS trigger AS
$BODY$
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
$BODY$
LANGUAGE plpgsql;


-- recompute `courses.lesson_count` on discussion creation
CREATE TRIGGER assign_lesson_achievements_trigger
AFTER INSERT OR DELETE OR UPDATE ON submissions
FOR EACH ROW EXECUTE PROCEDURE assign_lesson_achievements();




CREATE OR REPLACE FUNCTION assign_friendships_achievements()
  RETURNS trigger AS
$BODY$
DECLARE
  friend_count integer;
BEGIN
  SELECT count(*) FROM friendships WHERE source_id=new.source_id INTO friend_count;
  IF friend_count = 5 THEN
    INSERT INTO user_achievements(user_id, achievement_id) VALUES(new.source_id, (SELECT id FROM achievements where slug='friendship_2')) ON CONFLICT DO NOTHING;
  END IF;
  IF friend_count = 20 THEN
    INSERT INTO user_achievements(user_id, achievement_id) VALUES(new.source_id, (SELECT id FROM achievements where slug='friendship_3')) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NULL;
END;
$BODY$
LANGUAGE plpgsql;

CREATE TRIGGER assign_friendships_achievements_trigger
AFTER INSERT OR DELETE ON friendships
FOR EACH ROW EXECUTE PROCEDURE assign_friendships_achievements();




CREATE OR REPLACE FUNCTION assign_invites_achievements()
  RETURNS trigger AS
$BODY$
DECLARE
  invite_count integer;
BEGIN
  SELECT count(*) FROM invites WHERE inviter_id=new.inviter_id INTO invite_count;
  IF invite_count = 1 THEN  
    INSERT INTO user_achievements(user_id, achievement_id) VALUES(new.inviter_id, (SELECT id FROM achievements where slug='friendship_1')) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NULL;
END;
$BODY$
LANGUAGE plpgsql;


CREATE TRIGGER assign_invites_achievements_trigger
AFTER INSERT OR DELETE ON invites
FOR EACH ROW EXECUTE PROCEDURE assign_invites_achievements();




CREATE OR REPLACE FUNCTION assign_profile_achievements()
  RETURNS trigger AS
$BODY$
BEGIN
  IF new.avatar is not null and new.born_at is not null and new.phone_number is not null THEN  
    INSERT INTO user_achievements(user_id, achievement_id) VALUES(new.id, (SELECT id FROM achievements where slug='profile')) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NULL;
END;
$BODY$
LANGUAGE plpgsql;


CREATE TRIGGER assign_profile_achievements_trigger
AFTER INSERT OR UPDATE ON private.users
FOR EACH ROW EXECUTE PROCEDURE assign_profile_achievements();






CREATE OR REPLACE FUNCTION assign_vote_achievements()
  RETURNS trigger AS
$BODY$
DECLARE
  total_score integer;
  author_id integer;
BEGIN
  SELECT user_id FROM replies where id = new.reply_id INTO author_id;
  SELECT sum(replies.score) FROM replies WHERE replies.user_id = author_id
  INTO total_score;

  IF total_score = 5 THEN  
    INSERT INTO user_achievements(user_id, achievement_id) VALUES(author_id, (SELECT id FROM achievements where slug='vote_1')) ON CONFLICT DO NOTHING;
  END IF;
  IF total_score = 25 THEN
    INSERT INTO user_achievements(user_id, achievement_id) VALUES(author_id, (SELECT id FROM achievements where slug='vote_2')) ON CONFLICT DO NOTHING;
  END IF;
  IF total_score = 50 THEN
    INSERT INTO user_achievements(user_id, achievement_id) VALUES(author_id, (SELECT id FROM achievements where slug='vote_3')) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NULL;
END;
$BODY$
LANGUAGE plpgsql;


-- recompute `courses.lesson_count` on discussion creation
CREATE TRIGGER assign_vote_achievements_trigger
AFTER INSERT OR DELETE ON votes
FOR EACH ROW EXECUTE PROCEDURE assign_vote_achievements();











CREATE OR REPLACE FUNCTION assign_game_session_achievements()
  RETURNS trigger AS
$BODY$
BEGIN
  IF new.achievements is not null AND array_upper(new.achievements, 1) > 0 THEN
    FOR i IN 1 .. array_upper(new.achievements, 1)
    LOOP
      INSERT INTO user_achievements(user_id, achievement_id) VALUES(new.user_id, (SELECT id FROM achievements where slug=new.achievements[i])) ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
  RETURN NULL;
END;
$BODY$
LANGUAGE plpgsql;


CREATE TRIGGER assign_game_session_achievements_trigger
AFTER INSERT OR UPDATE OR DELETE ON game_sessions
FOR EACH ROW EXECUTE PROCEDURE assign_game_session_achievements();

