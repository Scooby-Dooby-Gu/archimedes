


INSERT INTO companies(name, wildcards, status, subdomain, description, url, image, plan401k) VALUES ('Archimedes', Array['getmedes.com'], 'enabled', 'archimedes', 'Finance literacy', 'getmedes.com', 'https://uploads-ssl.webflow.com/5d52dd897d6b7b08d4ed42c7/5d5c2af02325a4002d73e54d_logo.svg', '{
  "benefitsProvider": "Something",
  "benefitsProviderUrl": "http://something.com",
  "contactName": "Somebody",
  "contactEmail": "Somebody@gmail.com",
  "companyMatch": [{
    "enabled": true,
    "basis": 1.5,
    "limit": 5
  },{
    "enabled": true,
    "basis": 1.5,
    "limit": 5
  }]
  }');
INSERT INTO companies(name, wildcards, status, subdomain, description, url, image, plan401k) VALUES ('Gegol', Array['google.com'], 'disabled', 'google', 'Not being evil', 'google.com', 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png', '{
  "benefitsProvider": "Something",
  "benefitsProviderUrl": "http://something.com",
  "contactName": "Somebody",
  "contactEmail": "Somebody@gmail.com",
  "companyMatch": [{
    "enabled": true,
    "basis": 1.5,
    "limit": 5
  }]
  }');


INSERT INTO private.users(company_id, name, phone_number, email, avatar, facebook_id, google_id, role, api_key, verified_at, born_at) VALUES(
  1,
  'Simon Gu',
  '+122929929932',
  'simonx@getmedes.com',
  'https://ca.slack-edge.com/TMB9R9CMT-ULZS361K4-676a1ca12206-512',
  NULL,
  NULL,
  'admin',
  '1',
  NOW(),
  NOW()
);


INSERT INTO private.users(company_id, name, phone_number, email, avatar, facebook_id, google_id, role, api_key, verified_at, born_at) VALUES(
  1,
  'Yaroslaff Fedin',
  '+622929929932',
  'yarikx@getmedes.com',
  'https://ca.slack-edge.com/TMB9R9CMT-UQGURAR8B-54aad5ca09c0-512',
  NULL,
  NULL,
  'admin',
  '2',
  NOW(),
  NOW()
);

INSERT INTO private.users(company_id, name, phone_number, email, avatar, facebook_id, google_id, role, api_key, verified_at, born_at) VALUES(
  1,
  'Evan',
  NULL,
  'evan@getmedes.com',
  NULL,
  NULL,
  NULL,
  'moderator',
  '3',
  NOW(),
  NOW()
);

INSERT INTO private.users(company_id, name, phone_number, email, avatar, facebook_id, google_id, role, api_key, verified_at, born_at) VALUES(
  1,
  'Tom McLaughlin',
  NULL,
  'tom@getmedes.com',
  'https://ca.slack-edge.com/TMB9R9CMT-UQSHB55NZ-g3ff9795873e-512',
  NULL,
  NULL,
  'admin',
  '4',
  NOW(),
  NOW()
);

INSERT INTO private.users(company_id, name, phone_number, email, avatar, facebook_id, google_id, role, api_key, verified_at, born_at) VALUES(
  1,
  'Tomas Jasovsky',
  NULL,
  'tomasx+admin@getmedes.com',
  'https://ca.slack-edge.com/TMB9R9CMT-UMB9RM7SR-bf1581d09a64-512',
  NULL,
  NULL,
  'admin',
  'TOMAS-ADMIN',
  NOW(),
  NOW()
);



INSERT INTO private.users(company_id, name, phone_number, email, avatar, facebook_id, google_id, role, api_key, verified_at, born_at) VALUES(
  NULL,
  'Test Admin',
  '+122929929932',
  'yarikx+admin@getmedes.com',
  'https://ca.slack-edge.com/TMB9R9CMT-ULZS361K4-676a1ca12206-512',
  NULL,
  NULL,
  'admin',
  'SUPER-SECRET-ADMIN',
  NOW(),
  NOW()
);

INSERT INTO private.users(company_id, name, phone_number, email, avatar, facebook_id, google_id, role, api_key, verified_at, born_at) VALUES(
  NULL,
  'Yarik user',
  '+122929929932',
  'yarik+user@getmedes.com',
  'https://ca.slack-edge.com/TMB9R9CMT-ULZS361K4-676a1ca12206-512',
  NULL,
  NULL,
  'user',
  'USER',
  NOW(),
  NOW()
);


INSERT INTO achievements(slug, name, summary, icon) VALUES('profile', 'Ready player one', 'You’ve completed your profile.', '/assets/images/icons/1141046.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('lesson_1', 'Lesson one complete', 'You’ve completed your first lesson in Archimedes!', '/assets/images/icons/1141774.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('lesson_2', 'I am on a roll', 'Nice job! You’ve completed ten lessons. Keep on pushing!', '/assets/images/icons/1141766.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('lesson_3', 'Unstoppable', 'You’re absolutely killing it! 30 lessons down just like that. Keep up the good work.', '/assets/images/icons/1141776.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;

INSERT INTO achievements(slug, name, summary, icon) VALUES('unlock_game', 'Unlock: Paper chase', 'Put it into practice. You''re ready to play Paper Chase', '/assets/images/icons/play.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('unlock_videos', 'Unlock: Investing experts', 'Learn from the best. Hear what experts have to say.', '/assets/images/icons/experts.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('unlock_courses', 'Unlock: Free play', 'Nice job! Go your own way. Explore all of our lessons.', '/assets/images/icons/explorer.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;

INSERT INTO achievements(slug, name, summary, icon) VALUES('friendship_1', 'Sharing is caring', 'You’ve invited your first friend to learn and play alongside you. High five!', '/assets/images/icons/1141034.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('friendship_2', 'Social connector', 'Look at you! A social connector with 5 friends already.', '/assets/images/icons/1141027.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('friendship_3', 'Investment ambassador', 'You’ve invited 20 friends thus far. You’re essentially their investment ambassador!', '/assets/images/icons/investment_ambassador.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('discussion_1', 'Contributor', 'Congratulations on your first post! Thanks for contributing to the community.', '/assets/images/icons/1141031.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('discussion_2', 'Crushing it', 'You’ve made 10 posts. Keep making great discussions!', '/assets/images/icons/1721634.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('discussion_3', 'Top contributor', 'You’re one of the top contributors with 25 posts. Nice job!', '/assets/images/icons/1721593.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('vote_1', 'Trending up', 'Nice job at receiving 5 upvotes for an answer to someone’s question.', '/assets/images/icons/1141060.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('vote_2', 'Most helpful', 'Your answer was a huge help for 25 people. Stellar work!', '/assets/images/icons/1141038.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('vote_3', 'Information guru', 'Wow, over 50 people have found your answer helpful! Kudos!', '/assets/images/icons/information_guru.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('most_educated_in_company', 'Knowledge leader', 'Most educated in the company with the most amount of lessons passed.', '/assets/images/icons/786760.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;


INSERT INTO achievements(slug, name, summary, icon) VALUES('game_start', 'Chasing paper', 'One for the treble, two for the bass. Welcome to the incredible paper chase.', '/assets/images/icons/paper_chase.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('game_college', 'Collegiate scholar', 'Earned your undergraduate degree with honors and distinction.', '/assets/images/icons/1068044.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('game_dividend_manager', 'Dividend portfolio manager', 'Successful in creating a high dividend earning portfolio.', '/assets/images/icons/dividends.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('game_postgrad', 'Expert in your field', 'Great job at receiving a PhD and being top in your field.', '/assets/images/icons/expert_in_field.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('game_stocks', 'First-time investor', 'You’ve made your first investment. Good luck from here!', '/assets/images/icons/786797.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('game_property', 'Property owner', 'Welcome to being a first-time homeowner. Keep building your portfolio.', '/assets/images/icons/property_owner.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('game_happy_grandma', 'Favorite grandchild', 'You’ve made Nana proud by earning a return on her seed money.', '/assets/images/icons/781247.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('game_millionaire', 'Seasoned investor', 'Incredible, you’ve made your first million in the paper chase markets.', '/assets/images/icons/seasoned_investor.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('game_oracle', 'The oracle', 'You’ve made the most out of any player in the stock markets. You’re the oracle.', '/assets/images/icons/oracle.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('game_top_10', 'Titans of industry', 'Top 10 of players in Paper Chase. Collectively you all can start and run a small nation.', '/assets/images/icons/titan.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('game_top_1', 'Mogul', 'Highest score in Paper Chase. Nothing can stop you and the world is your playground.', '/assets/images/icons/mogul.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('game_bankrupt', 'Chapter 13', 'Go hard, go fast, and go broke. Living with parents again can’t that bad…right?', '/assets/images/icons/chapter_thirteen.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('game_taxes', 'Savvy with taxes', 'Unlocked loan interest tax reductions in Paper Chase.', '/assets/images/icons/taxes.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;

INSERT INTO achievements(slug, name, summary, icon) VALUES('game_passive_income', 'All expenses paid', 'Your passive income was higher than your expenses', '/assets/images/icons/profits.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('game_income', 'Incoming', 'Generated income from all sources at once (salary, interest, stock and mutual fund dividends, rent)', '/assets/images/icons/income.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('game_debt_free', 'All me, debt-free', 'Played through the entire game without taking on any debt', '/assets/images/icons/independent.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;

INSERT INTO achievements(slug, name, summary, icon) VALUES('game_bought_business', 'Back in business', 'Bought back the family business and are now the proud owner of PaperChase!', '/assets/images/icons/bought_business.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('game_defeated_boss', 'Fear no EVILCorp', 'Collected enough evidence to take down Mr. Sinister.', '/assets/images/icons/defeated_boss.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('game_leverage_challenge', 'Unburdened', 'Kept debt manageable every year of the Leverage Challenge.', '/assets/images/icons/leverage_challenge.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('game_tax_challenge', 'More for me', 'Kept tax rate low every year of the Tax Challenge.', '/assets/images/icons/tax_challenge.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('game_return_challenge', 'Money making money', 'Earned at least a 10% return every year of Grandma’s Final Challenge.', '/assets/images/icons/growth.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('game_news_challenge', 'Visionary', 'Correctly predicted direction of the stock price every year of the Company News Challenge.', '/assets/images/icons/oracle.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('game_tomas_challenge', 'Friends forever', 'Gave Tomas the right advice every year of the Teaching Tomas Challenge.', '/assets/images/icons/friends.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;
INSERT INTO achievements(slug, name, summary, icon) VALUES('game_evidence', 'Full caseload', 'Collected every piece of evidence against Mr. Sinister.', '/assets/images/icons/evidence.svg') ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug, name=excluded.name, summary=excluded.summary, icon=excluded.icon;






    






INSERT INTO friendships(source_id, target_id) VALUES(1, 2);
INSERT INTO friendships(source_id, target_id) VALUES(1, 3);
INSERT INTO friendships(source_id, target_id) VALUES(1, 4);

INSERT INTO friendships(source_id, target_id) VALUES(4, 1);
INSERT INTO friendships(source_id, target_id) VALUES(4, 2);

INSERT INTO friendships(source_id, target_id) VALUES(2, 1);
INSERT INTO friendships(source_id, target_id) VALUES(2, 4);

INSERT INTO friendships(source_id, target_id) VALUES(3, 1);




INSERT INTO boards("order", name, description) VALUES(1, 'General', 'Talking about everything');
INSERT INTO boards("order", name, description) VALUES(2, 'Private', 'Talking about private matters');
INSERT INTO boards("order", name, description) VALUES(3, 'Cool', 'Talking about cool matters');

-- Special board, id is hardcoded
INSERT INTO boards(id, name, description) VALUES(0, 'Company discussions', 'Discussions only visible for companies');

INSERT INTO topics("order", board_id, icon, name, description) VALUES(1, 1, 'https://image.flaticon.com/icons/svg/1391/1391283.svg', 'Life', 'Matters of life');
INSERT INTO topics("order", board_id, icon, name, description) VALUES(2, 1, 'https://image.flaticon.com/icons/svg/2478/2478302.svg', 'Death', 'Matters of death');
INSERT INTO topics("order", board_id, icon, name, description) VALUES(1, 2, 'https://image.flaticon.com/icons/svg/2478/2478332.svg', 'Men support', 'Helping men');
INSERT INTO topics("order", board_id, icon, name, description) VALUES(2, 2, 'https://image.flaticon.com/icons/svg/1391/1391283.svg', 'Women support', 'Helping women');
INSERT INTO topics("order", board_id, icon, name, description) VALUES(1, 3, 'https://image.flaticon.com/icons/svg/2478/2478302.svg', 'Beans', 'Cool beans');
INSERT INTO topics("order", board_id, icon, name, description) VALUES(2, 3, 'https://image.flaticon.com/icons/svg/2478/2478332.svg', 'Running', 'Cool running');


DO
$do$
BEGIN 
   FOR i IN 1..100 LOOP
      INSERT INTO discussions(topic_id, user_id, name, description) VALUES(random_between(1,6), random_between(1,4), 'How to basic? #' || i, 'Help me guys, i just dont know! #' || i);
   END LOOP;
   FOR i IN 1..1000 LOOP
    INSERT INTO replies(discussion_id, user_id, body) VALUES(random_between(1,100), random_between(1,4), 'I dont actually know #' || i);
   END LOOP;
   FOR i IN 1..3000 LOOP
    INSERT INTO votes(reply_id, user_id, score) VALUES(random_between(1,1000), random_between(1,4), 1) ON CONFLICT DO NOTHING;
   END LOOP;
END
$do$;



INSERT INTO courses("order", name, description, color, icon, difficulty, duration) VALUES(1, 'Investment', 'Grow moneys!', 'blue', '/assets/images/placeholder@2x.png', (SELECT myletter FROM (SELECT unnest(enum_range(NULL::lesson_difficulty)) as myletter ) sub ORDER BY random() LIMIT 1), random_between(4, 20)* 10);
INSERT INTO courses("order", name, description, color, icon, difficulty, duration) VALUES(2, '401k', 'Save moneys!', 'red', '/assets/images/placeholder@2x.png', (SELECT myletter FROM (SELECT unnest(enum_range(NULL::lesson_difficulty)) as myletter ) sub ORDER BY random() LIMIT 1), random_between(4, 20)* 10);
INSERT INTO courses("order", name, description, color, icon, difficulty, duration) VALUES(3, 'Stock options and other deriviatives', 'Buy companies!', 'violet', '/assets/images/placeholder@2x.png', (SELECT myletter FROM (SELECT unnest(enum_range(NULL::lesson_difficulty)) as myletter ) sub ORDER BY random() LIMIT 1), random_between(4, 20)* 10);
INSERT INTO courses("order", name, description, color, icon, difficulty, duration) VALUES(4, 'Mortgage', 'Get properties!', 'orange', '/assets/images/placeholder@2x.png', (SELECT myletter FROM (SELECT unnest(enum_range(NULL::lesson_difficulty)) as myletter ) sub ORDER BY random() LIMIT 1), random_between(4, 20) * 10);
INSERT INTO courses("order", name, description, color, icon, difficulty, duration) VALUES(5, 'Stock options and other deriviatives', 'Buy companies!', 'purple', '/assets/images/placeholder@2x.png', (SELECT myletter FROM (SELECT unnest(enum_range(NULL::lesson_difficulty)) as myletter ) sub ORDER BY random() LIMIT 1), random_between(4, 20)* 10);
INSERT INTO courses("order", name, description, color, icon, difficulty, duration) VALUES(6, 'Mortgage', 'Get properties!', 'black', '/assets/images/placeholder@2x.png', (SELECT myletter FROM (SELECT unnest(enum_range(NULL::lesson_difficulty)) as myletter ) sub ORDER BY random() LIMIT 1), random_between(4, 20) * 10);
INSERT INTO courses("order", name, description, color, icon, difficulty, duration) VALUES(7, 'Mortgage', 'Get properties!', 'green', '/assets/images/placeholder@2x.png', (SELECT myletter FROM (SELECT unnest(enum_range(NULL::lesson_difficulty)) as myletter ) sub ORDER BY random() LIMIT 1), random_between(4, 20) * 10);

INSERT INTO courses("order", name, description, color, icon, difficulty, duration) VALUES(8, 'Stock options and other deriviatives', 'Buy companies!', 'darkgray', '/assets/images/placeholder@2x.png', (SELECT myletter FROM (SELECT unnest(enum_range(NULL::lesson_difficulty)) as myletter ) sub ORDER BY random() LIMIT 1), random_between(4, 20)* 10);
INSERT INTO courses("order", name, description, color, icon, difficulty, duration) VALUES(9, 'Mortgage', 'Get properties!', 'vibrantgreen', '/assets/images/placeholder@2x.png', (SELECT myletter FROM (SELECT unnest(enum_range(NULL::lesson_difficulty)) as myletter ) sub ORDER BY random() LIMIT 1), random_between(4, 20) * 10);
INSERT INTO courses("order", name, description, color, icon, difficulty, duration) VALUES(10, 'Stock options and other deriviatives', 'Buy companies!', 'darkgreen', '/assets/images/placeholder@2x.png', (SELECT myletter FROM (SELECT unnest(enum_range(NULL::lesson_difficulty)) as myletter ) sub ORDER BY random() LIMIT 1), random_between(4, 20)* 10);
INSERT INTO courses("order", name, description, color, icon, difficulty, duration) VALUES(11, 'Mortgage', 'Get properties!', 'lightblue', '/assets/images/placeholder@2x.png', (SELECT myletter FROM (SELECT unnest(enum_range(NULL::lesson_difficulty)) as myletter ) sub ORDER BY random() LIMIT 1), random_between(4, 20) * 10);
INSERT INTO courses("order", name, description, color, icon, difficulty, duration) VALUES(12, 'Mortgage', 'Get properties!', 'yellow', '/assets/images/placeholder@2x.png', (SELECT myletter FROM (SELECT unnest(enum_range(NULL::lesson_difficulty)) as myletter ) sub ORDER BY random() LIMIT 1), random_between(4, 20) * 10);



DO
$do$
BEGIN 
  FOR i IN 1..60 LOOP
    INSERT INTO lessons(course_id, name, image, description, content_html, difficulty, duration, chapter_count, questions) VALUES(
      random_between(1,7), 
      'Learning to be the #' || i, 
      'https://uploads-ssl.webflow.com/5d52dd897d6b7b08d4ed42c7/5d5c3471fed559213c42e4e3_analyze-screenshot-p-1080.png',
      'You probably want to be the #' || i, 
      '<h2>Liquidity events</h2><p>Happy hour isn’t what we’re talking about here, but a liquidity event is a reason to celebrate. For companies, liquidity events lets you sell your stock and cash out. There’s a few different kinds of liquidity events:</p><figure class="details-box" data-type="section"><figcaption class="details-box-caption">Section</figcaption><div class="details-box-content"><p>test</p></div></figure><figure class="details-box" data-type="media"><figcaption class="details-box-caption">Media</figcaption><div class="details-box-content"><figure class="media"><div data-oembed-url="https://www.youtube.com/watch?v=G_-AsoYF-9o"><div style="position: relative; padding-bottom: 100%; height: 0; padding-bottom: 56.2493%;"><iframe src="https://www.youtube.com/embed/G_-AsoYF-9o" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0;" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen=""></iframe></div></div></figure></div></figure><figure class="details-box" data-type="external"><figcaption class="details-box-caption">Content</figcaption><div class="details-box-content"><p>test</p></div></figure><h3>IPO</h3><p>The most popular event is when a company goes public. By listing on Wallstreet, public investors are invited to buy shares and invest in the company. As a current shareholder, you’d be able to sell your shares to these investors.</p><p>Some restrictions on selling include lock-up periods and black-out periods.</p><figure class="details-box" data-type="section"><figcaption class="details-box-caption">Learn more</figcaption><div class="details-box-content"><p>Lock-up periods are placed on all insiders or holders of the stock before the IPO and prevent insiders from selling for typically 6 months after an IPO. The lock-up period is negotiated and determined between the company and investment banks underwriting the public offering and is set in place to prevent mass selling and to stabilize the price of the stock.</p></div></figure><p>Black-out periods are windows of time where employees at a public company are restricted from selling their stock. These periods are set in place to prevent employees from selling based on insider or private information that hasn’t been disclosed to the public.</p><h3>Tender</h3><p>Tenders are becoming increasingly popular as companies are staying private for longer. A tender offer is when current investors or new investors offer to buy shares from employees. Tenders result when investors want to invest more money than the company needs or is willing to sell new shares.</p><p>Restrictions are set by the company on the amount of shares current employees can sell.&nbsp;</p><figure class="details-box" data-type="section"><figcaption class="details-box-caption">More on that</figcaption><div class="details-box-content"><p>A popular restriction is that as long as you still work for the company, you can only sell a percentage of your vested shares. This helps the company retain talent so that you can’t cash out completely and go work for another company.</p><p>More paragraphs</p><blockquote><p>Even headers</p></blockquote></div></figure><h3>Other secondary transactions</h3><p>Another way of selling your shares is in a secondary market. As an employee you might be approached directly by another investor, without approval from the company, to purchase your shares. You also have the right to go look for a buyer yourself and negotiate a fair price.</p><p>The restriction on selling to an outsider is written in the Right of First Refusal or ROFR which is part of the equity agreement of the company.&nbsp;</p><figure class="details-box" data-type="external"><figcaption class="details-box-caption">Details</figcaption><div class="details-box-content"><p>ROFRs protect the company and allows the board to control who can be an owner in the company. Under a ROFR, after finding a buyer for your shares, the company has the right to purchase the shares directly from you at the price you’ve negotiated before the transaction happens. You still get paid out, but if the company enacts the ROFR, the cash comes from the company.</p></div></figure><h2>Taxes</h2><p>You’re taxed on gains from selling your stock and depending on if you have ISOs or NSOs you’re taxed differently.</p><figure class="details-box" data-type="section"><figcaption class="details-box-caption">ISOs</figcaption><div class="details-box-content"><p>ISOs have requirements for their tax advantages—meeting the requirements makes them a qualified disposition and failing to meet the requirements results in a disqualified disposition.&nbsp;</p><p>To meet these requirements you need to wait to sell until it’s been at least one year after you’ve exercised the options, and at least two years since the grant date.&nbsp;</p><p>To meet these requirements you need to wait to sell until it’s been at least one year after you’ve exercised the options, and at least two years since the grant date.&nbsp;</p><figure class="image"><img src="https://lh3.googleusercontent.com/n7UCuFmHj16D96_OcQ9xHUzTcqTI-U1il2HSFmFegpx8ZmhoTrT4VRshcEs55o-0XX06ZKU5GUCkIQ5VZQ6csGOr-4lmApqP5F0A4FpIjXiKxFYkydhfchjAgQasYlEclLpZtN0"><figcaption>Source: PwC</figcaption></figure><p>The qualified disposition results in the $60 difference between the sale price and the strike price being treated as long-term capital gain (typically 15%).</p><p>It’s important to note that if you are selling your shares having waited less than a year after exercising, the $20 difference between the strike price and the FMV at the time of exercise is treated as taxable income and the difference between the sale price and the FMV of $40 is taxed at the short-term capital gain rate.** Short-term capital gain is the same as regular income tax—as in $60 is taxed as income. This applies to people who wait to exercise until the sale.</p><p>** The exception is if you early exercised and decided to sell shares between a year to two years of the grant date (the last requirement to make this a qualified disposition), then the $40 difference is taxed at long-term capital gain since you’ve held the shares for longer than a year.</p></div></figure><figure class="details-box" data-type="section"><figcaption class="details-box-caption">NSOs</figcaption><div class="details-box-content"><p>NSOs are pretty straight forward. When you exercise you paid the income tax, and depending on how long you wait before selling the rest is taxed as either short-term capital gains or long-term capital gains. If you’ve waited for more than 1 year after exercising to sell, the gains would be long-term and if not, they would be short-term (for most the same as your income tax rate).</p><figure class="image"><img src="https://lh4.googleusercontent.com/fM0tE7LMwwGO2GOtew9IHsu6mhsGFSLhNceubXKwomc_CLGjuR6xH3D3cT0VGZK1gy7UXMB9NMGGaCKQEYLZV4gisaqgArzxJOdqZR4GUPEcFtTgmFdAaxc8gYQMU7HOTSkZr-s"><figcaption>Source: PwC</figcaption></figure><p>In this example, the $20 difference between the strike price and the FMV was recognized as income when you exercised. The difference of $40 between the sale price and the FMV can either be long-term capital gains or short-term capital gains depending on if you waited a year after exercising to sell.</p></div></figure><p>&nbsp;</p>', 
      (SELECT myletter FROM (SELECT unnest(enum_range(NULL::lesson_difficulty)) as myletter ) sub ORDER BY random() LIMIT 1), 
      random_between(4, 20),
      random_between(1, 8),
      '[{
        "type": "choice",
        "title": "Are you nice?", 
        "description": "Need to answer this",
        "correction": "Oh no, LOL. Tis not right",
        "options": [
          {
            "name": "yes",
            "correct": true
          },
          {
            "name": "no",
            "correct": false
          }
        ]
      },{
        "type": "ranking",
        "title": "What is the best?", 
        "description": "Need to rank this from worst to best",
        "correction": "Oh no, LOL. Tis not right LIKE AT ALL",
        "options": [
          {
            "name": "bad"
          },
          {
            "name": "good"
          },
          {
            "name": "great"
          }
        ]
      }]'::json
    );
  END LOOP;
END
$do$;


DO
$do$
BEGIN 
  FOR i IN 1..50 LOOP
    INSERT INTO submissions(lesson_id, user_id, created_at) VALUES(
      random_between(1,60), 
      random_between(1,5),
      NOW())
    ON CONFLICT DO NOTHING; 
  END LOOP;
END
$do$;


INSERT INTO games(name, description, content, image, id, is_enabled) VALUES(
  'Paper chase',
  'A game where you try to earn as much money as possible. Use your learned skills and be motivated to learn more. Beat your friends and coworkers!',
  '<h1>Exmaple html<h1><ul><li>1</li><li>2</li><li>3</li></ul>',
  '/assets/images/illustrations/paper_chase.png',
  'paper-chase',
  TRUE
);


INSERT INTO games(name, description, content, image, id, is_enabled) VALUES(
  'Paper maze',
  'You lost yourself and your hope in the bueracracy. Learn how to navigate the kafkian world of soulless clerks, application rejections and hidden credit ratings. Bend the system!',
  '<h1>Exmaple html<h1><ul><li>1</li><li>2</li><li>3</li></ul>',
  'https://ca.slack-edge.com/TMB9R9CMT-ULZS361K4-676a1ca12206-512',
  'paper-maze',
  FALSE
);

INSERT INTO games(name, description, content, image, id, is_enabled) VALUES(
  'Paper haze',
  'Dont let the higher class rule you. Enough gathering breadcrumbs from the rich peoples tables. Down with capitalizm, and up with Mazovean socio-economical dictatorship',
  '<h1>Exmaple html<h1><ul><li>1</li><li>2</li><li>3</li></ul>',
  'https://ca.slack-edge.com/TMB9R9CMT-ULZS361K4-676a1ca12206-512',
  'paper-haze',
  FALSE
);

