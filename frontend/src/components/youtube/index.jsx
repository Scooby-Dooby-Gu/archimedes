import { useEffect, useRef, useLazyScript, useOnScreen } from "/lib/hooks";
import style from './style.module.scss';
import { useReducer } from "preact/hooks";

export function parseYoutubeVideoID(url){
  var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  var match = url.match(regExp);
  return (match&&match[7].length==11)? match[7] : false;
}


export function parseYoutubeSeconds(url, name){
  return url.split(/[?&]/).reduce((result, pair) => {
    const values = pair.split('=');
    if (values.length == 2 && values[0] == name) {
      return parseSeconds(values[1]);
    }
    return result
  }, null);
}

export function parseSeconds(time) {
  return time.split(/:/g).reverse().map((n, i) => {
    return parseInt(n, 10) * (i == 0 ? 1 : i == 1 ? 60 : i == 2 ? 3600 : 1); 
  }).reduce((a, b) => a + b, 0)
}

export function useYoutube(ref, callbacks = {}) {
  const youtubeRef = useRef();
  const [ loader, loadScript ] = useLazyScript('https://www.youtube.com/iframe_api');
  const [ , refresh ] = useReducer((c) => c + 1, 0);

  useEffect(() => {
    return () => {
      if (youtubeRef.current) youtubeRef.current.remove();
    }
  }, [])

  youtubeRef.load = (src, options = {}) => {
    youtubeRef.targetSrc = src;
    youtubeRef.options = options; 
    if (loader.initial) {
      loadScript();
    } else if (!src) { // just needs to preload the iframe
      return;
    } else if (youtubeRef.player) {
      youtubeRef.player.playURL(src);
    } else {
      refresh();
    }
  }
  
  useEffect(() => {
    if (!loader.success || (youtubeRef.src == youtubeRef.targetSrc && youtubeRef.src)) return;
    youtubeRef.src = youtubeRef.targetSrc; 
    const callback = () => {
      // Video is cued on player load (so there's no autoplay), so that start/end range works
      // If a video hasnt started yet, seekTo doesn't work, so we have to use loadVideoById first
      // after that we can use seekTo
      if (youtubeRef.player) return;
      const width = ref.current.offsetWidth;
      const player = new YT.Player(ref.current, {
        events: {
          onReady: () => {
            if (youtubeRef.src)
              player.playURL(youtubeRef.src);
            if (callbacks.onReady)
              callbacks.onReady(player)
          },
          onStateChange: (event) => {
            if (event.data != -1 && event.data != 5) {
              youtubeRef.loaded = true;
            }
            if (event.data == 3 || event.data == 1) {
              clearTimeout(youtubeRef.timeout);
              if (callbacks.onStart)
                callbacks.onStart(player)
            }
            if (event.data == 2 || event.data == 0) {
              clearTimeout(youtubeRef.timeout);
              youtubeRef.timeout = setTimeout(() => {
                if (callbacks.onStop)
                  callbacks.onStop(player)
              }, 200);
            }
          }
        },
        playerVars: {
          ...youtubeRef.options,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          autohide: 1,
          frameborder: 0
        }
      });
      if (player.setSize && width)
        player.setSize(width, width / 16 * 9)
      player.playURL = (url) => {
        if (!player.getPlayerState) return; // didnt load yet?
        if (youtubeRef.options.autoplay) {
          player.loadVideoById({
            videoId: parseYoutubeVideoID(url),
            startSeconds: parseYoutubeSeconds(url, 'start'),
          })
          player.playVideo();
        // preload video to be ready for playing & timestamp seeking
        } else if (player.cueVideoById) {
          player.cueVideoById({
            videoId: parseYoutubeVideoID(url),
            startSeconds: parseYoutubeSeconds(url, 'start'),
            endSeconds: parseYoutubeSeconds(url, 'end')
          });
        }
      }
      player.seekToTimestamp = (time) => {
        if (!youtubeRef.loaded) {
          player.loadVideoById({
            videoId: parseYoutubeVideoID(youtubeRef.src),
            startSeconds: parseSeconds(time)
          })
        } else {
          player.seekTo(parseSeconds(time), true);
          player.playVideo();
        }
      };
      youtubeRef.current = player.getIframe();
      youtubeRef.player = player;
      youtubeRef.current.player = player;
      if (youtubeRef.current.parentNode) youtubeRef.current.parentNode.addEventListener('click', (e) => {
        if (!player.getPlayerState) return;
        if (player.getPlayerState() <= 0 || player.getPlayerState()  == 5)
          player.playVideo();
      })
    }
    if (!window.YT || !window.YT.Player) {
      if (!window.onYouTubeIframeAPIReady) {
        window.onYouTubeIframeAPIReady = () => {
          window.onYouTubeIframeAPIReadyCallbacks.forEach((c) => c());
          window.onYouTubeIframeAPIReadyCallbacks = [];
        }
      }
      if (!window.onYouTubeIframeAPIReadyCallbacks)
        window.onYouTubeIframeAPIReadyCallbacks = [];
      window.onYouTubeIframeAPIReadyCallbacks.push(callback);

    } else {
      callback();
    }
  }, [ref, loader.success, youtubeRef.targetSrc]);

  return youtubeRef
}

export default function Youtube({ src, ...props }) {
  const ref = useRef();
  const isIntersecting = useOnScreen(ref, '500px');
  const youtube = useYoutube(ref);
  useEffect(() => {
    if (!isIntersecting) return;
    youtube.load(src);
  }, [ref, isIntersecting])

  return <div class={`${style.video} video`}>
    <div class={style.player} player={true} src={src} {...props} ref={ref} allow="autoplay; fullscreen"></div>
  </div>
}


Youtube.Thumbnail = function({src}) {
  const youtubeId = parseYoutubeVideoID(src);
  return <img class={style.thumbnail} src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`} />
}