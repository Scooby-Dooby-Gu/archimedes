
import auth from './profile/auth.js';
import users from './profile/users.js';
import friendships from './profile/friendships.js';

import boards from './discuss/boards.js';
import topics from './discuss/topics.js';
import discussions from './discuss/discussions.js';
import replies from './discuss/replies.js';

import courses from './learn/courses.js';
import lessons from './learn/lessons.js';
import submissions from './learn/submissions.js';

import videos from './watch/videos.js';

import games from './play/games.js';

import companies from './admin/companies.js';
import members from './admin/users.js';
import invites from './admin/invites.js';
import logs from './admin/logs.js';
import notifications from './admin/notifications.js';

import marketingLessons from './marketing/lessons.js';



import ambitions from './progress/ambitions.js';

import waitlistSignups from './waitlist/users.js';
import passwordResetRequests from './profile/password_reset_requests.js';
export default function (app) {
  auth(app);

  users(app);
  friendships(app);

  videos(app);

  boards(app);
  topics(app);
  discussions(app);
  replies(app);

  games(app)

  courses(app);
  lessons(app);
  submissions(app);
  marketingLessons(app);

  ambitions(app);

  companies(app);
  members(app);
  invites(app);
  logs(app);
  notifications(app)
  waitlistSignups(app);
  passwordResetRequests(app)
}