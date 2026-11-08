import { render as slimdown } from 'slimdown-js';
import Embed from '/components/embed';
import Youtube from '/components/youtube';
import { PreactHTMLConverter } from '/lib/html';
import { formatSlug } from './slugs';
import { Figure } from '../components';

export function currency(number, max = 999, precision = 2) {
  const parsed = parseFloat(number);
  if (number < 1 && number > 0) {
    return parseFloat(number.toFixed(2)) * 100 + 'c'
  }
  if (Math.abs(parsed) > 999999) {
    var string = parseFloat((Math.abs(parsed) / 1000000).toFixed(2)) + 'M';
  } else if (Math.abs(parsed) > max) {
    var string = parseFloat((Math.abs(parsed) / 1000).toFixed(1)) + 'K';
  } else {
    var string = String(parseFloat((Math.abs(parsed)).toFixed(precision)));
  }
  if (number < 0) {
    return '-$' + string;
  } else {
    return '$' + string;
  }
}

export function rate(number, precision = 2) {
  if (number !== number) {
    return '0%'
  }
  return parseFloat(parseFloat(number * 100).toFixed(precision)) + '%'
}

export function percentage(number, total) {
  return rate(number / total);
}

export function years(number) {
  return number == 1 ? number + 'yr' : number + 'yrs';
}

export function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function duration(number, total) {
  if (number > 60) {
    return parseFloat(parseFloat(number / 60).toFixed(1)) + 'h'
  }
  return number + 'min';
}
export function interval(duration) {
  if (duration == null) return;

  // Hours, minutes and seconds
  var hrs = ~~(duration / 3600);
  var mins = ~~((duration % 3600) / 60);
  var secs = ~~duration % 60;

  // Output like "1:01" or "4:03:59" or "123:03:59"
  var ret = "";

  if (hrs > 0) {
      ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
  }

  ret += "" + mins + ":" + (secs < 10 ? "0" : "");
  ret += "" + secs;
  return ret;
}

function renderMarkdown(text) {
  return slimdown(text.replace(/([^\s\n])[\t ]*\n[\t\ ]*([^\s\n_*])/g, '$1 $2')).replace(/(?![^<]*>|[^<>]*<\/(?!(?:p|pre|h1|li|ul|ol)>))((https?:)\/\/[a-z0-9&#=.\/\-?_]+)/gi, '<a href="$1">$1</a>')
}

// For trusted text written by staff or bundled with the app (goal and game
// descriptions), which may contain HTML on purpose.
export function markdown(text) {
  if (text && text.isPlaceholder) {
    return text;
  }
  return text && <div class="markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />
}

// Turn user-written markdown into safe HTML: any HTML in the text is shown as
// text, quotes can't break out of the link/image attributes the markdown
// renderer writes, and links/images may only use http(s), mailto or relative URLs.
export function safeMarkdownHtml(text) {
  const escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  return renderMarkdown(escaped).replace(/\b(href|src)=(['"])(.*?)\2/gi, (match, attr, quote, url) => {
    const decoded = url.replace(/&amp;/g, '&').trim();
    const allowed = /^(https?:|mailto:|\/|#|\?)/i.test(decoded) || !/^[a-z][a-z0-9+.-]*:/i.test(decoded);
    return allowed ? match : `${attr}=${quote}#${quote}`;
  });
}

// For anything users write: forum posts, replies, board/topic descriptions.
export function userMarkdown(text) {
  if (text && text.isPlaceholder) {
    return text;
  }
  return text && <div class="markdown" dangerouslySetInnerHTML={{ __html: safeMarkdownHtml(text) }} />
}

export function and(bits, joiner = 'and') {
  const filtered = bits.filter(Boolean);
  if (filtered.length == 1) {
    return filtered[0]
  } else {
    return filtered.slice(0, filtered.length - 1).join(', ') + ' ' + joiner + ' ' + filtered[filtered.length - 1]
  }
}

export function titlize(string) {
  return string.replace(/^(.)|([a-z])([A-Z])/g, (m, f, l, r) => {
    return f ? f.toUpperCase() : l + ' ' + r.toLowerCase();
  })
}

export function name(userName) {
  return userName.split(' ')[0]
}

export function uuid(value = Math.random()) {
  return value.toString(36).substr(2, 9)
}

export function fromNow(date, date2 = new Date) {
  const distance = date - date2;
  if (distance < 60 * 1000) {
    return parseInt(distance / 1000) + 's'
  } else if (distance < 60 * 1000 * 60) {
    return parseInt(distance / (1000 * 60)) + 'min'
  } else if (distance < 60 * 1000 * 60 * 24) {
    return parseInt(distance / (1000 * 60 * 60)) + 'hrs'
  } else {
    return parseInt(distance / (1000 * 60 * 60 * 24)) + ' days'
  }
}

export function slug(value) {
  return formatSlug(value);
};

export function html(text, mapping = {
  oembed: Embed,
  figure: Figure,
  youtube: Youtube
}) {
  const converter = PreactHTMLConverter();
  for (var componentName in mapping) {
    converter.registerComponent(componentName, mapping[componentName]);
  }

  return converter.convert(text
    .replace(/(<mark[^>]*question[^>]*>)/gi, '$1<span class="offset"></span>')
    .replace(/<iframe([^>]*youtu.?be.*?)\/iframe>/gi, '<youtube$1/youtube>')
    .replace(/<section([^>]*question[^>]*>.*?)<\/section>/g, ''))
}


