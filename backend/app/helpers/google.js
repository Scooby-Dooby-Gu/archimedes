import g from 'google-auth-library';
export const client = new g.OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, () => {

});

export const verifyGoogleToken = (token) => {
  return new Promise(function(resolve, reject) {
    client.verifyIdToken({
      idToken: token
    }, function(e, login) {
        console.log(e);
        if (login) {
            var payload = login.getPayload();
            var googleId = payload['sub'];
            resolve(googleId);
        } else {
            reject("invalid token");
        }
      }
    )
  })
}