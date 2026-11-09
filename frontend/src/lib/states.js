// How the app reads the lifecycle of the records it shows. Each function
// mirrors a backend machine in backend/app/states/ (the backend owns the
// transitions; this file only reads the current state). A backend test checks
// they agree. See docs/STATE_MACHINES.md.

// Account: 'guest' (signed out) | 'unverified' (signed up, waiting to verify) | 'active'.
export function accountState(user) {
  if (!user) return 'guest';
  return user.verifiedAt ? 'active' : 'unverified';
}

// Expert assistance on a discussion: 'none' | 'requested' | 'resolved'.
// Events (sent as {state: event} to PUT .../assistance): request, cancel, resolve, reset.
export function assistanceState(discussion) {
  if (!discussion) return 'none';
  if (discussion.assistanceProvidedAt) return 'resolved';
  if (discussion.assistanceRequestedAt) return 'requested';
  return 'none';
}

// A video: 'upcoming' (not published yet; people can send questions for the
// experts) | 'published'. Upcoming videos may have a scheduledAt date.
export function videoState(video) {
  return video && video.publishedAt ? 'published' : 'upcoming';
}
