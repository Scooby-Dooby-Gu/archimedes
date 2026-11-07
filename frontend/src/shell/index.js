// Desktop "phone frame". Archimedes was designed for phones, so on wide
// screens we show the real app inside a phone-sized iframe instead of
// stretching it. Inside the iframe the window really is phone-width, so every
// existing mobile media query and width check applies unchanged.
//
// index.html decides whether to load this module or the app itself
// (see the shell check there). `?noframe` opens the plain full-width app.
import qrcode from 'qrcode-generator';
import './shell.css';

const PHONE = { width: 390, height: 844 };   // CSS pixels of the app viewport
const BEZEL = 14;                           // frame thickness around it
const appUrl = (import.meta.env.APP_URL || location.origin).replace(/\/+$/, '');
const siteUrl = (import.meta.env.SITE_URL || '').replace(/\/+$/, '');

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const child of [].concat(children)) if (child) node.appendChild(child);
  return node;
}

function qrSvg(text) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}

// Path the iframe should open: whatever the address bar says now.
function framedPath() {
  const url = new URL(location.href);
  url.searchParams.delete('noframe');
  return url.pathname + url.search + url.hash;
}

function build() {
  document.documentElement.classList.add('archimedes-shell');
  document.body.innerHTML = '';
  document.body.removeAttribute('style');

  const iframe = el('iframe', {
    class: 'shell-app',
    src: framedPath(),
    title: 'Archimedes app',
    allow: 'clipboard-write; web-share; fullscreen',
    width: String(PHONE.width),
    height: String(PHONE.height),
  });

  const phone = el('div', { class: 'shell-phone', role: 'presentation' }, [
    el('div', { class: 'shell-island' }),
    iframe,
  ]);
  const stage = el('div', { class: 'shell-stage' }, [phone]);

  const qr = el('div', { class: 'shell-qr', role: 'img', 'aria-label': `QR code for ${appUrl}` });
  qr.innerHTML = qrSvg(appUrl);

  const panel = el('aside', { class: 'shell-panel' }, [
    el('div', { class: 'shell-logo', text: '♛ Archimedes' }),
    el('h1', { text: 'Your investment coach' }),
    el('p', { text: 'Short lessons, games and expert videos that build the confidence to make investing a bigger part of your life.' }),
    el('div', { class: 'shell-phone-cta' }, [
      qr,
      el('div', {}, [
        el('strong', { text: 'Best on your phone' }),
        el('p', { text: 'Scan to open it there, then use "Add to Home Screen" to keep it like an app.' }),
      ]),
    ]),
    el('nav', { class: 'shell-links' }, [
      siteUrl ? el('a', { href: siteUrl, text: 'About Archimedes' }) : null,
      el('a', { href: framedPath().replace(/^([^?#]*)(\?[^#]*)?/, (m, p, q) => p + (q ? q + '&' : '?') + 'noframe'), text: 'Open full width' }),
    ]),
  ]);

  document.body.appendChild(el('main', { class: 'shell' }, [panel, stage]));

  // Scale the phone down on short or narrow windows; the app inside keeps
  // its 390px width, it is only drawn smaller.
  function fit() {
    const outerW = PHONE.width + BEZEL * 2;
    const outerH = PHONE.height + BEZEL * 2;
    // Height is the constraint: the frame is only used on windows at least
    // 900px wide, and the side panel hides below 1000px.
    const availH = window.innerHeight - 48;
    const availW = window.innerWidth - 48;
    const scale = Math.min(1, availH / outerH, availW / outerW);
    phone.style.setProperty('--scale', String(Math.max(0.5, scale)));
    stage.style.setProperty('--phone-h', `${outerH * Math.max(0.5, scale)}px`);
  }
  window.addEventListener('resize', fit);
  fit();

  // Keep the address bar and tab title in step with the app, so links can be
  // copied and reloads land on the same page. (The iframe's own history
  // entries already make the back button work.)
  let last = '';
  setInterval(() => {
    let win;
    try { win = iframe.contentWindow; } catch (e) { return; }
    if (!win || !win.location) return;
    let href;
    try { href = win.location.pathname + win.location.search + win.location.hash; } catch (e) { return; }
    if (href && href !== last && href !== 'blank') {
      last = href;
      const current = location.pathname + location.search + location.hash;
      if (href !== current) history.replaceState(null, '', href);
    }
    try {
      if (win.document && win.document.title && document.title !== win.document.title) {
        document.title = win.document.title;
      }
    } catch (e) {}
  }, 300);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
else build();
