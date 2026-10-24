'use strict';
/* Yo'ldosh — illyustratsiyalar (SVG, rasm fayllarisiz): davlat manzaralari, bo'lim bannerlari, samolyot */
const ART = (() => {
  const PAL = {
    russia: ['#4f7cff', '#b794f6'], kazakhstan: ['#38bdf8', '#34d399'], turkey: ['#f87171', '#fb923c'], korea: ['#f472b6', '#a78bfa'],
    uae: ['#fbbf24', '#f97316'], poland: ['#fb7185', '#f59e0b'], uk: ['#6366f1', '#38bdf8'], def: ['#fb923c', '#f59e0b']
  };
  const onion = (x, y, w, h) => `<path d="M${x - w} ${y} Q${x - w - 3} ${y - h * .45} ${x} ${y - h} Q${x + w + 3} ${y - h * .45} ${x + w} ${y}Z"/><rect x="${x - .8}" y="${y - h - 9}" width="1.6" height="9"/>`;
  const rects = a => a.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`).join('');
  const hills = '<path d="M0 150 L0 118 Q40 96 85 116 T170 112 T255 114 T360 108 L360 150Z"/>';
  const SHAPES = {
    russia: {
      far: rects([[20, 118, 320, 32], [58, 96, 14, 54], [288, 96, 14, 54]]) + '<polygon points="56,96 74,96 65,78"/><polygon points="286,96 304,96 295,78"/>',
      main: rects([[172, 74, 16, 76], [133, 104, 14, 46], [213, 104, 14, 46], [99, 120, 12, 30], [249, 120, 12, 30]]) + onion(180, 74, 11, 30) + onion(140, 104, 8, 22) + onion(220, 104, 8, 22) + onion(105, 120, 6, 14) + onion(255, 120, 6, 14)
    },
    kazakhstan: {
      far: '<path d="M0 150 L0 112 L38 78 L62 100 L100 64 L140 104 L190 84 L240 108 L282 70 L318 100 L360 82 L360 150Z"/>',
      main: '<polygon points="176,150 184,150 183,62 177,62"/><circle cx="180" cy="48" r="16"/><polygon points="236,150 318,150 296,104 280,56 276,104"/>' + rects([[20, 128, 26, 22], [50, 118, 20, 32], [100, 132, 30, 18], [140, 122, 22, 28], [200, 130, 24, 20]])
    },
    turkey: {
      far: hills + rects([[20, 110, 10, 40]]) + '<polygon points="19,110 31,110 25,92"/>',
      main: '<path d="M142 150 L142 112 A38 38 0 0 1 218 112 L218 150Z"/><path d="M110 150 L110 128 A14 14 0 0 1 138 128 L138 150Z"/><path d="M222 150 L222 128 A14 14 0 0 1 250 128 L250 150Z"/>' +
        rects([[88, 70, 8, 80], [86, 92, 12, 4], [264, 70, 8, 80], [262, 92, 12, 4]]) + '<polygon points="86,70 98,70 92,48"/><polygon points="262,70 274,70 268,48"/><rect x="179" y="62" width="2" height="12"/><circle cx="180" cy="58" r="5"/>'
    },
    korea: {
      far: '<path d="M0 150 L0 120 Q60 84 120 118 T240 112 T360 104 L360 150Z"/>' + rects([[285, 72, 6, 78]]) + '<circle cx="288" cy="70" r="8"/>',
      main: [[34, 128], [28, 106], [22, 84], [16, 62]].map(([w, y]) => `<polygon points="${180 - w - 8},${y + 3} ${180 - w},${y} ${180 + w},${y} ${180 + w + 8},${y + 3} ${180 + w - 4},${y + 9} ${180 - w + 4},${y + 9}"/><rect x="${180 - w + 7}" y="${y + 9}" width="${2 * w - 14}" height="${y === 128 ? 13 : 13}"/>`).join('') + rects([[177, 36, 6, 28], [60, 138, 240, 12]])
    },
    uae: {
      far: rects([[20, 112, 14, 38], [44, 100, 16, 50], [70, 120, 18, 30], [270, 108, 18, 42], [296, 118, 16, 32], [320, 100, 14, 50]]),
      main: '<polygon points="172,150 172,112 175,112 175,82 178,82 178,52 180,52 181,16 182,52 184,52 184,82 187,82 187,112 190,112 190,150"/>' + rects([[108, 96, 18, 54], [132, 80, 14, 70], [214, 90, 16, 60], [240, 106, 20, 44], [84, 120, 18, 30], [264, 124, 20, 26]])
    },
    poland: {
      far: rects([[20, 116, 40, 34], [300, 112, 40, 38]]) + '<polygon points="20,116 40,98 60,116"/><polygon points="300,112 320,94 340,112"/>',
      main: rects([[160, 100, 40, 50], [166, 80, 28, 20], [172, 60, 16, 20], [128, 122, 32, 28], [200, 122, 32, 28]]) + '<polygon points="174,60 186,60 180,22"/>' +
        '<polygon points="62,150 62,128 76,112 90,128 90,150"/><polygon points="92,150 92,134 104,122 116,134 116,150"/><polygon points="244,150 244,130 258,114 272,130 272,150"/><polygon points="274,150 274,136 286,124 298,136 298,150"/>'
    },
    uk: {
      far: rects([[20, 118, 50, 32], [290, 114, 50, 36]]) + '<circle cx="300" cy="100" r="34" fill="none" stroke="#0b1b4d" stroke-width="3"/>',
      main: rects([[168, 62, 24, 88], [96, 112, 72, 38], [192, 112, 74, 38], [110, 100, 6, 12], [128, 100, 6, 12], [212, 100, 6, 12]]) + '<polygon points="166,62 194,62 180,22"/><circle cx="180" cy="80" r="7" fill="#fff" opacity=".55"/>'
    },
    def: {
      far: rects([[10, 108, 24, 42], [40, 96, 20, 54], [270, 100, 22, 50], [300, 112, 30, 38]]),
      main: rects([[70, 112, 28, 38], [102, 90, 22, 60], [130, 104, 26, 46], [164, 80, 30, 70], [200, 100, 24, 50], [230, 116, 30, 34]]) + hills.replace('M0 150 L0 118', 'M0 150 L0 134')
    }
  };
  const cloud = (y, s, d, delay) => `<g class="cl" style="animation-duration:${d}s;animation-delay:${delay}s"><g transform="translate(0 ${y}) scale(${s})" fill="#fff" opacity=".78"><ellipse cx="0" cy="0" rx="22" ry="8"/><ellipse cx="14" cy="-6" rx="14" ry="8"/><ellipse cx="-12" cy="-4" rx="12" ry="7"/></g></g>`;
  let uid = 0;
  function scene(slug, mini) {
    const p = PAL[slug] || PAL.def, sh = SHAPES[slug] || SHAPES.def, id = 'sg' + (++uid);
    return `<svg class="scene ${mini ? 'mini' : ''}" viewBox="0 0 360 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient></defs>
    <rect width="360" height="150" fill="url(#${id})"/>${mini ? '' : `<circle cx="304" cy="40" r="17" fill="#fff" opacity=".85"/>${cloud(34, 1, 46, -10)}${cloud(62, .8, 62, -34)}${cloud(22, .6, 54, -22)}`}
    <g fill="#0b1b4d" opacity=".2">${sh.far}</g><g fill="#0b1b4d" opacity="${mini ? .45 : .55}">${sh.main}</g></svg>`;
  }
  const PLANE = '<svg viewBox="0 0 48 24" width="46" aria-hidden="true"><path d="M2 12 L14 9 L22 1 L26 1 L22 9 L38 8 Q46 8 46 12 Q46 16 38 16 L22 15 L26 23 L22 23 L14 15 Z" fill="#fff"/></svg>';
  const plane = (cls = '') => `<div class="plane ${cls}">${PLANE}</div>`;

  const BAN = { ticket: ['#2563eb', '#38bdf8'], transfer: ['#059669', '#34d399'], housing: ['#7c3aed', '#c084fc'], jobs: ['#db2777', '#fb7185'], places: ['#0891b2', '#22d3ee'] };
  const IMG = {
    ticket: `<svg viewBox="0 0 120 90"><path id="tp" d="M8 74 Q38 6 70 40 T112 14" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.2" stroke-dasharray="4 5"><animate attributeName="stroke-dashoffset" from="18" to="0" dur="1.2s" repeatCount="indefinite"/></path>
      <circle cx="8" cy="74" r="4" fill="#fff"/><circle cx="112" cy="14" r="4" fill="#fde68a"/>
      <path d="M-11 0 L-3 -3 L3 -10 L6 -10 L3 -3 L11 -3 Q14 -3 14 0 Q14 3 11 3 L3 3 L6 10 L3 10 L-3 3 Z" fill="#fff"><animateMotion dur="4s" repeatCount="indefinite" rotate="auto"><mpath href="#tp"/></animateMotion></path></svg>`,
    transfer: `<svg viewBox="0 0 120 90"><rect x="0" y="60" width="120" height="30" rx="6" fill="#000" opacity=".25"/><line x1="0" x2="120" y1="75" y2="75" stroke="#fff" stroke-width="3" stroke-dasharray="10 8"><animate attributeName="stroke-dashoffset" from="0" to="-18" dur=".6s" repeatCount="indefinite"/></line>
      <g><animateTransform attributeName="transform" type="translate" values="0 0;0 -1.6;0 0" dur=".5s" repeatCount="indefinite"/><rect x="34" y="42" width="52" height="16" rx="6" fill="#fff"/><path d="M42 42 L50 30 H70 L78 42Z" fill="#fff"/><rect x="53" y="33" width="6" height="8" fill="#34d399"/><rect x="62" y="33" width="6" height="8" fill="#34d399"/><circle cx="46" cy="60" r="6" fill="#111827"/><circle cx="74" cy="60" r="6" fill="#111827"/><circle cx="46" cy="60" r="2" fill="#fff"/><circle cx="74" cy="60" r="2" fill="#fff"/></g></svg>`,
    housing: `<svg viewBox="0 0 120 90"><circle cx="86" cy="20" r="3" fill="#fff" opacity=".7"><animate attributeName="cy" values="26;4" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values=".7;0" dur="2.4s" repeatCount="indefinite"/></circle><circle cx="90" cy="22" r="4" fill="#fff" opacity=".6"><animate attributeName="cy" values="28;6" dur="3s" repeatCount="indefinite"/><animate attributeName="opacity" values=".6;0" dur="3s" repeatCount="indefinite"/></circle>
      <rect x="80" y="26" width="9" height="20" fill="#fff" opacity=".9"/><path d="M16 52 L60 18 L104 52Z" fill="#fff"/><rect x="26" y="50" width="68" height="34" fill="#fff" opacity=".93"/><rect x="52" y="62" width="16" height="22" rx="2" fill="#a78bfa"/>
      <rect x="34" y="58" width="14" height="12" rx="1" fill="#fde68a"><animate attributeName="opacity" values="1;.35;1" dur="2.6s" repeatCount="indefinite"/></rect><rect x="72" y="58" width="14" height="12" rx="1" fill="#fde68a"><animate attributeName="opacity" values=".4;1;.4" dur="3.1s" repeatCount="indefinite"/></rect></svg>`,
    jobs: `<svg viewBox="0 0 120 90"><g><animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="1.8s" repeatCount="indefinite"/><path d="M26 64 Q26 26 60 26 Q94 26 94 64Z" fill="#fde047"/><rect x="18" y="64" width="84" height="10" rx="5" fill="#facc15"/><rect x="54" y="26" width="12" height="38" fill="#eab308"/></g>
      <g transform="translate(98 22)"><g><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="6s" repeatCount="indefinite"/><circle r="8" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="4 3"/><circle r="3" fill="#fff"/></g></g>
      <path d="M16 20 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#fff"><animate attributeName="opacity" values="1;.2;1" dur="1.6s" repeatCount="indefinite"/></path></svg>`,
    places: `<svg viewBox="0 0 120 90"><ellipse cx="60" cy="76" rx="8" ry="3" fill="#fff" opacity=".7"><animate attributeName="rx" values="6;34" dur="1.8s" repeatCount="indefinite"/><animate attributeName="ry" values="2;10" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values=".7;0" dur="1.8s" repeatCount="indefinite"/></ellipse>
      <g><animateTransform attributeName="transform" type="translate" values="0 0;0 -7;0 0" dur="1.4s" repeatCount="indefinite"/><path d="M60 10 C44 10 38 22 38 30 C38 44 60 68 60 68 C60 68 82 44 82 30 C82 22 76 10 60 10Z" fill="#fff"/><circle cx="60" cy="30" r="8" fill="#0891b2"/></g></svg>`
  };
  function banner(sec, title, hint) {
    const c = BAN[sec];
    return `<section class="banner" style="--b1:${c[0]};--b2:${c[1]}"><div class="bt"><h2>${title}</h2><p>${hint}</p></div><div class="bi">${IMG[sec]}</div></section>`;
  }
  function hero(slug, title, sub) {
    return `<section class="herob">${scene(slug)}${plane()}<div class="tx"><h1>${title}</h1><p>${sub}</p></div></section>`;
  }
  return { scene, plane, banner, hero };
})();
