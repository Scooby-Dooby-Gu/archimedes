import webpush from 'web-push';
import apnModule from 'apn';

webpush.setVapidDetails(
  'mailto:simon@getmedes.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const apn = new apnModule.Provider({
  token: {
    key: "./app/secret/apn_development/AuthKey_L955HC3RRR.p8",
    keyId: "L955HC3RRR",
    teamId: "785LT86GCK"
  },
  production: true//process.env.NODE_ENV !== 'development'
});

export { webpush, apn }

export async function sendNotification(req, userId, content, throttle) {
  console.log("Attempting notification", userId, content);

  const devices = await req.locals.select(
    'SELECT id, token, platform FROM private.devices WHERE user_id=$1', 
    [userId], 
    'select-user-devices');

  const key = content.key || content.link;
  if (devices.length) {
    if (throttle) {
      const interval = typeof throttle === 'string' ? throttle : '1 day';
      const previous = await req.locals.selectOne(`
        SELECT * 
        FROM logs 
        WHERE type = 'notification'
          AND user_id = $1 
          AND label = $2
          AND created_at > NOW() - $3::interval`,
      [userId, key, interval],
      'find-throttling-notification')

      if (previous) {
        console.log('Already sent notification on ' + new Date(previous.createdAt).toISOString())
        return;
      }
    }
  }

  return Promise.all(devices.map((device) => {
    console.log('Sending notification: ' + device.platform + ' of user ' + userId)
    return sendSingleNotification(device.platform, device.token, content)
    .then((e) => {
      const body = content.body && content.body.length > 300 ? content.body.substring(0, 297) + '...' : content.body;
      return req.locals.query(`
        INSERT INTO logs(type, user_id, category, action, label)
        VALUES('notification', $1, $2, $3, $4)
      `, [userId, content.title, body, key],
      'insert-notification-log')
    }).catch((e) => {
      console.log('Deleting subscription: ' + device.platform + ' of user ' + userId, e)
      return req.locals.query('DELETE FROM private.devices where id=$1', [device.id], 'delete-user-device').then(() => false)
    })
  }))
}
export async function sendSingleNotification(platform, token, { title, body, ...data}  ) {
  if (data.link && data.link.indexOf('//') == -1)
    data.link = `${process.env.APP_URL}${data.link}`
  if (platform === 'ios') { 
    var note = new apnModule.Notification()
    
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    //note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = { title, body }
    note.payload = data;
    note.topic = "com.getmedes.frontend";
    const result = await apn.send(note, token);
    if (result && result.failed.length) {
      console.log("APN failed", result.failed[0])
      const error = new Error('APN Failed ' + result);
      error.data = result.failed
      throw error;
    }
    return result
  } else {
    const subscription = JSON.parse(token);
    const badge = 'https://staging.getmedes.com/assets/icons/pwa-monochrome-96x96.png'
    const icon = 'https://staging.getmedes.com/assets/icons/pwa-monochrome-96x96.png'
    return await webpush.sendNotification(subscription, JSON.stringify({ title, body, data, icon, badge }));
  }
}