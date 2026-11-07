export function playFirstVideoAt(element, timestamp) {
  const iframe = element.querySelector('iframe[player]');
  if (iframe && iframe.player) {
    iframe.player.seekToTimestamp(timestamp || '00:00');
    const notch = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-top") || 0);
    iframe.scrollIntoViewCustom({
      block: 'start',
      behavior: 'smooth',
      offsetTop: - 70 - notch,
    })
  }
}