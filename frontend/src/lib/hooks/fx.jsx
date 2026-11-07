import { loadScript } from "./request";
import { useCallback, useRef, useEffect } from "preact/hooks";

export function useConfetti(settings, duration = 5000, interval, dependencies) {
  if (!settings) {
    settings = () => [{
      particleCount: 4,
      angle: 60,
      spread: 80,
      origin: {
          x: 0,
          y: 0.5
      },
    }, {
      particleCount: 4,
      angle: 120,
      spread: 80,
      origin: {
          x: 1,
          y: 0.5
      },
    }]
  }
  const runConfetti = useCallback((canvas) => {
    var end = Date.now() + (duration);
    loadScript('https://cdn.jsdelivr.net/npm/canvas-confetti@1.0.3/dist/confetti.browser.min.js').then(() => {
      canvas.width = canvas.scrollWidth;
      canvas.height = canvas.scrollHeight;
      const myConfetti = confetti.create(canvas, {
        resize: true,
      });
      const frame = () => {
        settings().map((myConfetti))
        if (Date.now() < end) {
          if (interval) {
            setTimeout(frame, interval)
          } else {
            requestAnimationFrame(() => {
              requestAnimationFrame(frame)
            });
          }
        }
      }
      setTimeout(frame, 1000);
    })
  }, []);

  const canvasRef = useRef();
  useEffect(() => {
    if (canvasRef.current && !canvasRef.paused) {
      runConfetti(canvasRef.current)
    }
  }, [canvasRef.current].concat(dependencies || []));

  return canvasRef;
}