import { Return } from "../components";

export function timestamp(time) {
  const seconds = time.split(/:/g).reverse().map((n, i) => {
    return parseInt(n, 10) * (i == 0 ? 1 : i == 1 ? 60 : i == 2 ? 3600 : 1); 
  }).reduce((a, b) => a + b, 0);
  if (isNaN(seconds)) return null;
  return seconds;
}


export function youtubeVideoId(url){
  var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  var match = url.match(regExp);
  return (match&&match[7].length==11)? match[7] : false;
}


export function youtubeSeconds(url, name){
  return url.split(/[?&]/).reduce((result, pair) => {
    const values = pair.split('=');
    if (values.length == 2 && values[0] == name) {
      return parseSeconds(values[1]);
    }
    return result
  }, null);
}

export function commaSeparatedList(string) {
  return string.trim().split(/\s*,\s*/).filter(Boolean);
}