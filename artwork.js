'use strict';

/* Small, deterministic watercolor plates. Pigment and pen are separate layers:
   pooled, granulated washes sit beneath imperfect contours and dry hatching.
   Everything is SVG; motion uses small CSS opacity/transform changes only. */
(() => {
  const COLOR = {
    paper: 'var(--paper, #ddc18a)', ink: '#3c332a', pine: '#3e5849', indigo: '#4e6370',
    ochre: '#ba9055', wood: '#8f7054', rust: '#985a49', light: '#f8e6b8'
  };
  const escapeAttribute = value => String(value).replace(/[&<>"']/g, char =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const pen = (d, weight = 1.2, opacity = .8, color = 'ink') =>
    `<path d="${d}" fill="none" stroke="${COLOR[color]}" stroke-width="${weight * 1.18}" opacity="${opacity}"/>`;
  const fill = (d, color, opacity = 1) => `<path d="${d}" fill="${COLOR[color]}" opacity="${opacity}"/>`;
  const layers = (pigment, lines) => `<g filter="url(#@wash)">${pigment}</g><g filter="url(#@pen)">${lines}</g>`;

  function randomFor(key) {
    let seed = 2166136261;
    for (const char of key) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
    return () => {
      seed += 0x6D2B79F5;
      let t = Math.imul(seed ^ seed >>> 15, seed | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // Overlapping, asymmetrical puddles leave pale gaps and darker drying rims.
  function bloom(x, y, rx, ry, color, opacity, key) {
    const random = randomFor(key);
    const points = Array.from({ length: 14 }, (_, i) => {
      const angle = i * Math.PI / 7;
      const radius = .68 + random() * .38;
      return [x + Math.cos(angle) * rx * radius, y + Math.sin(angle) * ry * radius];
    });
    const mid = (a, b) => `${((a[0] + b[0]) / 2).toFixed(1)} ${((a[1] + b[1]) / 2).toFixed(1)}`;
    let d = `M${mid(points[13], points[0])}`;
    points.forEach((point, i) => { d += `Q${point[0].toFixed(1)} ${point[1].toFixed(1)} ${mid(point, points[(i + 1) % 14])}`; });
    return `<path d="${d}Z" fill="${COLOR[color]}" opacity="${opacity}" stroke="${COLOR[color]}" stroke-width="2.4" stroke-opacity=".3"/>`;
  }

  function flecks(key) {
    const random = randomFor(key);
    return Array.from({ length: 95 }, () => {
      const x = 62 + random() * 596, y = 52 + random() * 366;
      const radius = .25 + random() * 1.1;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius.toFixed(1)}" fill="${random() > .6 ? COLOR.rust : COLOR.wood}" opacity="${(.04 + random() * .12).toFixed(2)}"/>`;
    }).join('');
  }

  function room(dark = false) {
    const washes = fill('M95 139 358 42 629 138 600 310 518 268 205 265 112 319Z', 'pine', dark ? .32 : .16) +
      fill('M110 157 231 110 227 266 112 319Z', 'indigo', .20) +
      fill('M491 109 618 156 600 310 502 267Z', 'pine', .24) + bloom(590, 250, 19, 68, 'pine', .18, 'wall-pool') +
      bloom(355, 173, 99, 83, 'ochre', .10, 'room-light') +
      fill('M230 266 498 265 652 414 64 414Z', 'wood', .1) +
      bloom(167, 276, 85, 123, 'pine', .13, 'left-damp') +
      bloom(565, 276, 79, 118, 'indigo', dark ? .28 : .12, 'right-damp');
    let lines = pen('M101 311 106 142 357 47 620 144 603 312', 1.7, .55, 'pine') +
      pen('M122 156 358 67 603 155M142 183 358 94 579 181M168 208 358 126 552 208', 1.5, .58) +
      pen('M125 160 357 72 598 160M148 187 356 100 572 185', .55, .46, 'wood') +
      pen('M231 117 230 266 498 267 494 118M111 315 230 266M499 267 600 313', 1, .48) +
      pen('M106 142 120 156 117 306M621 145 605 158 593 304', .7, .6);
    // Floorboards converge on the far wall; broken marks suggest worn timber.
    for (let i = 0; i < 9; i++) {
      lines += pen(`M${238 + i * 31} 269 ${65 + i * 73} 414`, .7, .28, 'wood');
    }
    lines += pen('M93 355Q351 348 625 356M69 398Q357 386 646 398M164 349l29-3m-51 14 21-3m327 14 42 3m-63 5 23 3M250 310l12-6m219 17 18 3', .7, .3);
    lines += pen('M122 213l54-19m-52 27 61-21m-55 33 41-14M522 205l61 20m-57-9 54 17m-49-6 46 15M234 242l32-1m10 0 32 1m96-1 28 1m12 0 43 1M190 180l11 5m-4-15 10 6M521 172l-8 5m14 0-8 5', .48, .36);
    const window = fill('M334 161Q357 133 381 161L381 230 333 230Z', 'light', .75) +
      fill('M339 166Q357 141 376 166L376 224 339 224Z', 'indigo', .12) +
      pen('M333 231 334 161Q357 133 381 161L381 231M330 234h56M358 146v82M335 183h44M336 207h43', 1, .65) +
      pen('M337 226v-60q20-24 40 0', .55, .5, 'wood');
    return layers(washes, lines) + window;
  }

  function bench(x, y, scale = 1, angle = 0) {
    const seat = 'M-102 1 72-8 103 4-73 17Z';
    const back = 'M-100-39 71-48 74-21-98-11Z';
    return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">` + layers(
      fill(back, 'pine', .25) + fill(seat, 'ochre', .36) + fill('M-73 17 103 4 100 15-72 28Z', 'wood', .42) +
      fill('M-88-5-83 57-75 59-76-7M75-13 83 49 90 48 86-15Z', 'wood', .36) + bloom(-27, -24, 41, 8, 'pine', .13, 'bench-grain'),
      pen(`${back}M-99-35 71-44M-90-32l145-8M-92-19l91-5M-84-13v21M62-22v15`, 1.2, .84) +
      pen(`${seat}M-73 17v11L100 15l3-11M-84 24l1 32 9 3-1-33M76 19l6 31 9-2-5-31`, 1.85, .94) +
      pen('M-61 7 66 0M-45 12l90-5M-83-29l28-2m18-1 44-2M-76 31l2 20M88 22l2 16', .55, .66, 'wood') +
      pen('M-99-37l-1 20m5-2 1-9m3 8 1-10m3 9 1-7M64-42l1 17m4-13 1 11', .6, .58)
    ) + '</g>';
  }

  // Side benches recede in perspective; rotating a front view would tilt the legs.
  function sideBench(right = false) {
    const back = 'M230 219 150 286 146 330 227 264Z';
    const seat = 'M226 270 145 337 180 351 262 282Z';
    return `<g${right ? ' transform="translate(720 0) scale(-1 1)"' : ''}>` + layers(
      fill(back, 'pine', .39) + fill(seat, 'ochre', .43) +
      fill('M145 337 180 351 262 282 263 295 183 365 144 349Z', 'wood', .42),
      pen(back, 1.7, .88) + pen(seat, 1.95, .92) +
      pen('M146 330 144 349 183 365 263 295 262 282M153 350 151 397 163 399 166 358M246 307l1 43 10 1-2-51M181 365v40m-9-38-2 32', 1.7) +
      pen('M225 227 156 284M223 243 151 301M218 259 152 315M154 341l73-63m-62 69 82-68M157 365l-1 25M251 315v25', .65, .68, 'wood') +
      pen('M226 232l-2 19m-4-14-1 15M154 296v19m4-22v17m4-25v19', .7, .57)
    ) + '</g>';
  }

  function square(missing = false) {
    return bench(358, 253, .61) + sideBench() + sideBench(true) +
      (missing ? pen('M290 368q70-10 140 0', .8, .23, 'wood') : bench(359, 365, 1.08)) +
      pen('M319 288 401 287 434 333 286 335Z', .6, .26, 'ochre');
  }

  function pine(x, y, scale = 1, angle = 0) {
    let needles = '';
    for (let i = 0; i < 15; i++) {
      const px = i * 10, py = -i * .25 + Math.sin(i * 2.1) * 2.5;
      needles += pen(`M${px} ${py}l-22-21m23 22-15-27m16 27-4-25m4 27-19 18m20-19-9 25m12-27 4 23`, .7, .65, 'pine');
    }
    return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">` + layers(
      bloom(60, -3, 87, 24, 'pine', .27, 'pine-needles'),
      pen('M-30 5Q50-7 146-3M12 0q13-18 36-22M68-2q9 17 34 25M109-3q7-12 30-18', 1.3, .85, 'wood') + needles
    ) + '</g>';
  }

  function cone(x, y, scale = 1) {
    let scales = '';
    for (let i = 0; i < 5; i++) {
      const yy = i * 7 - 15, half = 11 - Math.abs(i - 2) * 2;
      scales += pen(`M${-half} ${yy}q${half / 2} 9 ${half} 0q${half / 2} 9 ${half} 0M0 ${yy}v4`, .7, .7);
    }
    return `<g transform="translate(${x} ${y}) rotate(22) scale(${scale})">` + layers(
      fill('M0-24Q25-5 14 20Q0 34-14 20Q-26-6 0-24Z', 'wood', .54),
      pen('M0-24Q25-5 14 20Q0 34-14 20Q-26-6 0-24Z', 1) + scales
    ) + '</g>';
  }

  function musicLine(x, y, width, variation = 0) {
    let lines = '';
    for (let i = 0; i < 4; i++) lines += pen(`M${x} ${y + i * 5}q${width / 2} -3 ${width} 1`, .48, .47);
    for (let i = 0; i < 6; i++) {
      const px = x + 12 + i * (width - 23) / 6, py = y + ((i + variation) % 3) * 5 + 4;
      const shapes = [
        `M${px} ${py}l6 5h-6Z`,
        `M${px} ${py}a3 2 0 1 0 6 0a3 2 0 1 0-6 0`,
        `M${px} ${py}h6v4h-6Z`,
        `M${px + 3} ${py - 1}l4 3-4 3-4-3Z`
      ];
      lines += fill(shapes[(i + variation) % 4], 'ink', .65) + pen(`M${px + 6} ${py + 2}v-13`, .7, .65);
    }
    return lines;
  }

  function book(x, y, scale = 1, angle = 0, variation = 0) {
    const left = 'M0 7Q-68-16-132 5L-130 115Q-65 91 0 116Z';
    const right = 'M0 7Q63-17 127 3L133 112Q64 92 0 116Z';
    let notes = '';
    for (let row = 0; row < 3; row++) {
      notes += musicLine(-114, 32 + row * 25, 91, row + variation) + musicLine(21, 31 + row * 25, 91, row + variation + 1);
    }
    return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">` +
      layers(fill('M-141 12Q-69-15 0 13Q69-15 138 9L144 122Q67 102 0 125Q-67 103-137 128Z', 'rust', .66),
        pen('M-141 12Q-69-15 0 13Q69-15 138 9L144 122Q67 102 0 125Q-67 103-137 128Z', 1.5)) +
      fill(left, 'paper') + fill(right, 'paper') +
      layers(fill('M-132 5Q-110 9-101 5L-103 110-130 115Z', 'ochre', .19) +
        fill('M0 7Q10 38 3 113L-7 113Q-16 45 0 7Z', 'wood', .17) +
        bloom(82, 80, 43, 37, 'ochre', .10, 'page-stain'),
        pen(left + right, 1.3, .9) + pen('M0 10q-6 48 0 103M-128 120q66-25 125-1M6 119q63-22 127-1M-119 16q43-10 94-1M22 15q44-10 91 0', .6, .63) + notes) +
      pen('M-137 27l2 79m271-76 2 79M-121 111l22-6M119 99l3 13', .7, .55, 'rust') + '</g>';
  }

  function closedBook(x, y, scale = 1, angle = 0) {
    return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">` + layers(
      fill('M-133-24 77-46 133-15-74 14Z', 'pine', .70) + bloom(-15, -12, 94, 12, 'indigo', .2, 'book-cloth') +
      fill('M-74 14 133-15 132 18-72 49Z', 'light', .68) +
      fill('M-133-24-74 14-72 49-131 6Z', 'pine', .85) +
      fill('M-73 49 133 18 141 26-72 59-140 11-131 6Z', 'rust', .57),
      pen('M-133-24 77-46 133-15 132 18 141 26-72 59-140 11-133-24-74 14 133-15M-74 14-72 59M-132 6-73 49 132 18', 1.5) +
      pen('M-70 22 121-6M-70 29 127 1M-70 36 122 9M-69 42 127 15M-114-23 74-40 109-18-74 7Z', .65, .64) +
      pen('M-46-18l70-8m-48 0 50-6m-29 22 39-6M-123-10l38 24m-40-14 38 25', .6, .86, 'ochre') + pen('M-109-20l16 4m4-7 19 6m6-9 11 4m4-7 23 5m9-7 12 3M-114-17l39 23m-35-14 29 17M67-37l22 10m-12-3 19 9', .45, .46) +
      pen('M-114-23 74-40 109-18-74 7Z M-100-22l4 3-7 3m178-19-4 4 8 2M-71 1l3-4-8-1M99-19l-5-1 1 4', .65, .8, 'ochre') +
      pen('M-46-23l34-5m-25 8 40-6m-13 9 30-5M-81-10l3 2m3-5 3 2m3-4 3 2m28-12 4 2m5-4 3 2m9-4 4 2m13-3 3 2m5-3 4 2', .5, .43) +
      pen('M38 30 42 66 52 57 61 63 57 27', 1.1, .85, 'rust')
    ) + '</g>';
  }

  function candle(x, y, scale = 1, flame = true) {
    const glow = flame ? `<g class="art-glow">${layers(
      bloom(0, -83, 58, 91, 'ochre', .14, 'candle-glow') +
      bloom(-5, -112, 31, 44, 'light', .3, 'flame-glow') +
      bloom(0, -105, 12, 23, 'light', .74, 'flame-center'), '')}</g>` : '';
    const flameOrSmoke = flame ? `<g class="art-flame">${layers(
      fill('M0-82C-16-94-9-108 2-123 7-106 20-94 0-82Z', 'ochre', .58),
      pen('M0-83C-13-93-6-111 2-122M4-115q14 21-2 32', .8, .65, 'rust'))}</g>` :
      `<g class="art-smoke">${pen('M1-85q-11-10-1-20t-2-18', .7, .42, 'indigo')}</g>`;
    return `<g transform="translate(${x} ${y}) scale(${scale})">` + glow + layers(
      fill('M-12-71Q0-78 12-71L10 0-12 0Z', 'light', .86) +
      fill('M4-73 12-71 10 0 1 0Z', 'ochre', .28) + fill('M-35 3Q0-11 35 3L26 12-28 12Z', 'wood', .25),
      pen('M-12-71Q0-78 12-71L10 0M-12-71V0M-14 0h28M-33 3Q0-12 33 3L26 12h-54Z', 1.35, .77) +
      pen('M-8-69q4 9 7 2t6 8M-5-4V-56M0-77l1-7M-25 7h48', .65, .62) +
      pen('M-10-57q5-5 5 8v8q4 6 5-1v-19m6 8v23q-4 6-5-1M-9-8l3-8m8-2 2-13M-28 5l8 5m-1-9 9 8m-2-10 9 10m0-12 8 10m1-8 8 6', .55, .65, 'wood') +
      pen('M-32 4q-18-7-21 5t22 8m-1-9q-12-5-15 2t15 3', 1, .65)
    ) + flameOrSmoke + '</g>';
  }

  function chair(x, y, scale = 1) {
    return `<g transform="translate(${x} ${y}) rotate(-5) scale(${scale})">` + layers(
      fill('M-43-94 29-95 38-12-40-9Z', 'wood', .22) +
      fill('M-46-10 36-18 52 2-29 15Z', 'ochre', .42) +
      fill('M-29 15 52 2 51 11-28 24Z', 'wood', .42),
      pen('M-46-104-40-9M31-105 38-16M-42-96q36-11 74-1M-40-76q34-9 73-2M-37-59q34-8 71-1M-26-74l4 51M-6-76l3 48M16-77l4 47', 1.65) +
      pen('M-46-10 36-18 52 2-29 15Z M-29 15v66m-8-67-2 63M50 4l-1 64m-8-54 2 52M-42-7l-5 57M-29 54l73-6', 1.8) +
      pen('M-36-4 34-11M-22 3l52-6M-38-91l8-3m2 11 19-2M-26 24l2 45', .65, .62, 'wood')
    ) + '</g>';
  }

  const ground = (key, dark = false) => layers(
    bloom(355, 367, 239, 55, dark ? 'indigo' : 'wood', dark ? .26 : .14, key) +
    bloom(377, 385, 155, 24, 'pine', .1, `${key}-pool`), '');

  const scenes = {
    title() {
      return ground('title') + layers(
        bloom(377, 346, 257, 61, 'ochre', .21, 'title-table') +
        bloom(425, 346, 158, 44, 'wood', .18, 'title-pool'),
        pen('M116 368q228-34 475-8m-442 19q218-25 404-15M177 394l53-5m255-7 66-5', .65, .49, 'wood')) +
        candle(204, 298, 1.62) + closedBook(407, 314, 1.35, -8) +
        `<g transform="translate(535 377) rotate(-17)">` +
        fill('M-45-14 39-20 44 23 34 25 29 31 18 25 7 32-4 26-19 32-27 25-41 30Z', 'light', .75) +
        musicLine(-33, -5, 65, 2) + pen('M-39-13 37-19M41 22l-7 3-5 6-11-6-11 7', .65, .62) + '</g>' +
        pine(247, 386, 1.18, -15) + pine(238, 384, .75, -135) + cone(366, 408, .88);
    },
    meetinghouse() { return room() + ground('meeting') + square() + pen('M359 183v20m-7-12h14', .7, .52, 'wood'); },
    wrongPages() {
      return room() + ground('pages') + square() + book(245, 288, .48, 21, 0) +
        book(486, 286, .46, -18, 2) + book(357, 359, .65, -6, 3);
    },
    thumbprint() {
      let ridges = '';
      for (let i = 0; i < 9; i++) {
        ridges += pen(`M${-20 - i * 1.8} ${8 + i * 2}C${-34 - i * 2} ${-32 - i * 3} ${31 + i * 2} ${-43 - i * 3} ${24 + i * 2} ${5 + i * 3}Q${17 + i * 2} ${31 + i * 2} ${-5 - i} ${27 + i * 2}`, .9, .48);
      }
      return layers(bloom(151, 193, 72, 113, 'pine', .15, 'thumb-bg') + bloom(571, 229, 91, 156, 'wood', .14, 'thumb-edge'), '') +
        ground('thumb') + book(355, 155, 1.67, -8) +
        `<g transform="translate(410 267) rotate(24)">` + layers(bloom(0, 0, 34, 48, 'ink', .48, 'thumb-ink'), ridges) + '</g>' +
        pen('M116 377l72-9m342-59 36-7m-31 12 25-5', .6, .45, 'rust');
    },
    emptyChair() {
      return room() + bench(281, 258, .65) + sideBench() +
        layers(fill('M381 278Q351 348 458 419L566 419 432 280Z', 'indigo', .21), '') +
        ground('chair') + layers(
          fill('M174 284Q184 267 211 279L223 327 215 330 212 340 204 335 196 342 186 335Z', 'rust', .42),
          pen('M174 284q12-14 37-5l12 48m-41-40 15 49m-7-45 16 42m-10-45 17 39', .75, .55, 'rust')) +
        chair(394, 322, 1.1);
    },
    pencilNote() {
      return layers(bloom(537, 200, 89, 114, 'pine', .17, 'pencil-bg') + bloom(163, 288, 91, 77, 'ochre', .18, 'pencil-wash'), '') +
        ground('pencil') + book(353, 160, 1.62, 6) +
        layers(fill('M394 327 557 180 565 190 402 337 382 345Z', 'ochre', .58),
          pen('M394 327 557 180 565 190 402 337 382 345Z M394 327l8 10M549 188l8 9M557 180l7-6 8 9-7 7', 1.15) +
          pen('M399 328 558 188M383 344l8-5', .7, .75)) +
        pen('M189 308q7-13 10-1t9-5q7-7 6 3t12-3m-40 18q16-5 44 1M194 342q10-4 36 0', .85, .7, 'wood');
    },
    floorboards() {
      let grain = '';
      for (let i = 0; i < 10; i++) {
        grain += pen(`M${88 + i * 50} 275Q${108 + i * 46} 344 ${61 + i * 63} 418`, 1.1, .65, 'wood') +
          pen(`M${94 + i * 50} 296l-5 27m${-3 + i} 10-8 45`, .6, .45, 'wood');
      }
      return room(true) + bench(359, 245, .74) + layers(
        fill('M80 274 631 269 654 418 59 418Z', 'wood', .18) +
        fill('M272 342Q358 326 447 342L449 355Q357 345 266 359Z', 'ink', .61) +
        bloom(357, 347, 127, 42, 'pine', .22, 'floor-voice'),
        grain + pen('M82 285Q348 273 634 284M66 410q296-21 584 1M269 341q86-14 179 1M266 359q89-16 183-4', 1, .8) +
        pen('M168 334q16-16 32-2t-31 8m4-4 23-1M504 391q16-13 30-1t-28 6', .65, .6)) +
        `<g transform="translate(179 377) rotate(-16)">` + fill('M-28-17 21-20 30 20 17 18 11 24-1 17-13 23-26 18Z', 'light', .39) + musicLine(-23, -10, 44, 1) + '</g>';
    },
    heavyBook() {
      return room(true) + ground('heavy', true) +
        layers(fill('M146 348Q367 316 574 347L585 394 133 398Z', 'wood', .17),
          pen('M147 351q209-37 429-2M143 368q219-26 434-3M135 393q222-19 448-3', .7, .52, 'wood')) +
        closedBook(355, 298, 1.46, -6) + pine(480, 366, .7, -13) + cone(565, 368, .6) + pen('M248 391q47-7 91-4m83-11 69-8', .75, .6);
    },
    threeBenches() {
      return room(true) + ground('missing', true) + square(true) + candle(307, 308, .24) + candle(409, 308, .24) + candle(297, 353, .29) + candle(428, 353, .29) +
        layers(bloom(359, 365, 114, 26, 'light', .07, 'missing-light'), '') +
        pen('M310 361l11-2m80 0 12 2M278 392l4-7m150-3 4 7', .85, .43, 'wood');
    },
    closedBook() {
      return room(true) + sideBench() + sideBench(true) + ground('leader') +
        layers(fill('M269 281 402 270 450 300 314 317Z', 'wood', .3) + fill('M345 314 359 315 365 398 350 400Z', 'pine', .43),
          pen('M269 281 402 270 450 300 314 317Z M314 317v8L450 307v-7M345 321l5 79m9-82 6 80M320 403l70-9m-67 13 67-9', 1.4)) +
        closedBook(358, 266, .7, -3);
    },
    wrongShadow() {
      return layers(bloom(422, 228, 185, 147, 'pine', .23, 'shadow-wall'), '') +
        `<g class="art-shadow">${layers(
          fill('M370 282Q400 250 395 225L383 212 383 197 369 195Q366 189 378 180L379 160Q386 117 428 126Q463 132 458 169L453 202Q482 225 518 239L548 319Z', 'ink', .62) +
          bloom(456, 267, 82, 57, 'indigo', .22, 'shadow-edge'),
          pen('M378 180l-9 12 14 5v15l12 13M453 202q34 28 65 37', .85, .52))}</g>` +
        ground('shadow', true) + candle(219, 328, 1.56, false) + closedBook(428, 350, 1.18, -9);
    },
    placeInSquare() {
      return room(true) + ground('last', true) + square() +
        layers(bloom(358, 316, 45, 40, 'light', .16, 'empty-light'), '') +
        pen('M333 308q25-7 50-1M332 311l-10 19q33-5 70-1l-9-19', .65, .45, 'wood') +
        candle(564, 337, .9);
    }
  };

  function wrap(scene, label) {
    // Prefix every paint server: title and story SVGs coexist in the game DOM.
    const id = `hollow-art-${scene}`;
    const seed = Object.keys(scenes).indexOf(scene) + 17;
    const body = scenes[scene]();
    const atmosphere = layers(
      fill('M106 176Q170 123 213 192L188 331Q129 353 104 291Z', 'ochre', .055) +
      bloom(563, 295, 67, 115, 'pine', .055, `${scene}-edge`), '');
    return `<svg class="programmatic-art" viewBox="0 0 720 468" role="img" aria-label="${escapeAttribute(label)}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="${id}-wash" x="-12%" y="-16%" width="124%" height="132%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".025 .045" numOctaves="3" seed="${seed}" result="flow"/>
          <feDisplacementMap in="SourceGraphic" in2="flow" scale="9" xChannelSelector="R" yChannelSelector="G" result="spread"/>
          <feColorMatrix in="flow" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  .8 0 0 0 .38" result="wetness"/>
          <feComposite in="spread" in2="wetness" operator="in" result="settled"/>
          <feTurbulence type="fractalNoise" baseFrequency=".48" numOctaves="3" seed="${seed + 3}" result="grain"/>
          <feColorMatrix in="grain" type="saturate" values="0"/>
          <feComponentTransfer result="granulation">
            <feFuncR type="table" tableValues=".65 1"/><feFuncG type="table" tableValues=".65 1"/><feFuncB type="table" tableValues=".65 1"/><feFuncA type="table" tableValues="1 1"/>
          </feComponentTransfer>
          <feComposite in="settled" in2="granulation" operator="arithmetic" k1="1" k2="0" k3="0" k4="0"/>
        </filter>
        <filter id="${id}-pen" x="-3%" y="-3%" width="106%" height="106%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".14" numOctaves="2" seed="8" result="tooth"/>
          <feDisplacementMap in="SourceGraphic" in2="tooth" scale=".85" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
      <g stroke-linecap="round" stroke-linejoin="round">${atmosphere}${body}</g>
      ${flecks(scene)}
    </svg>`.replaceAll('#@wash', `#${id}-wash`).replaceAll('#@pen', `#${id}-pen`);
  }

  window.HollowArt = {
    title() { return wrap('title', 'An ink drawing with watercolor washes of a green songbook, a candle, pine branches, and a torn shape-note score.'); },
    story(scene, label) {
      const key = Object.hasOwn(scenes, scene) && scene !== 'title' ? scene : 'meetinghouse';
      return wrap(key, label);
    }
  };
})();
