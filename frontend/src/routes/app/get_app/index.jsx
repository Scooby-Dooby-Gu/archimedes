import { useEffect } from "/lib/hooks";

// This screen used to ask people to download the iOS/Android apps, which no
// longer exist; the web app is the app now (installable with "Add to Home
// Screen"). Old links to /get_app go straight into the app.
export default function GetApp() {
  useEffect(() => {
    route('/ambitions');
  }, []);
  return null;
}
