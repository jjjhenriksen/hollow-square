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
    // Fragments of the interior dissolve into the real page; no enclosing roof.
    const washes = fill('M119 94Q147 86 177 102L173 254 93 340 86 262 105 149Z', 'pine', dark ? .2 : .12) +
      fill('M482 102Q553 97 603 121L638 305 612 354 550 261 549 107Z', 'indigo', dark ? .22 : .12) +
      fill('M187 104Q356 85 550 108L553 175Q475 152 380 171L198 161Z', 'ochre', .11) +
      fill('M541 181Q566 198 584 213L608 320 586 298 540 260Z', 'pine', .16) +
      bloom(140, 268, 36, 61, 'pine', .14, 'wainscot-pool') +
      bloom(530, 244, 29, 46, 'indigo', .14, 'stove-pool') +
      fill('M152 275Q337 249 564 276L630 400Q490 385 442 417L217 421 97 392Z', 'wood', .055);
    let lines = pen('M112 95q22-4 63 7M187 103q127-14 208-8m27 2 127 11M550 108l23 68m8 23 16 66m7 23 15 52', .9, .55, 'wood') +
      pen('M179 104l-3 151M549 109l1 143M174 253l-76 87m455-83 67 85M184 247l44-1m17 0 67 0m87 0 49 2m19 1 45 2', .85, .5) +
      pen('M111 123l56-10M106 151l65-19M102 179l69-23M96 207l73-27M91 238l73-33M88 269l75-35M90 300l63-34', .55, .37, 'wood') +
      pen('M185 168l57 1m11 0 69-1m28-1 48 1m12 0 97 4M185 188l92 2m24-1 39 1m21 1 78 2m12 0 91 3M181 218l74 1m12 0 61 1m24 0 77 2m10 0 72 3', .55, .4, 'wood') +
      pen('M204 172l1 13m81-13 1 15m107-13 1 14m89-9 1 16M231 195l1 22m114-21 1 23m111-16 2 21', .5, .35, 'wood');
    // Overhead beams taper away; omit portions to retain the loose sketch edge.
    lines += pen('M105 66 221 98m4 1 69-5M124 60 238 92m133-45 10 48m8-47 2 46M541 94l62-26m-56 18 39-18', 1.3, .48) +
      pen('M108 72l25-3m7 10 24-1m10 8 24-1M377 62l6 14m167 8 17-5', .5, .4, 'wood');
    for (let i = 0; i < 10; i++) {
      const x = -325 + i * 71;
      const a = project(x, 0, 560), b = project(x, 0, 70);
      const t = .24 + (i % 3) * .16;
      const c = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      lines += pen(`M${a.join(' ')}Q${c[0] + 1.4} ${c[1] - 1} ${b.join(' ')}`, .55, .24, 'wood');
    }
    lines += pen('M93 390l42-4m12-1 64-5m17-1 31-2m202-4 47 4m15 1 42 4M235 329l29-3m178 9 36 3', .6, .35, 'wood');
    return layers(washes, lines) + windowPlate(238, 113, 57, 92, false) +
      windowPlate(446, 116, 60, 94, true) + stove(540, 239, .62);
  }

  function windowPlate(x, y, width, height, mirrored) {
    const outer = `M${x} ${y}l${width} 2 1 ${height}-${width + 3} 2Z`;
    let trees = '';
    for (let i = 0; i < 4; i++) {
      const px = x + 10 + i * 11, py = y + 32 + (i % 3) * 9;
      trees += fill(`M${px} ${py}l-5 18h3l-6 12h16l-6-12h3Z`, 'pine', .2) + pen(`M${px} ${py + 7}v37`, .45, .32, 'pine');
    }
    return fill(outer, 'light', .18) + layers(
      fill(`M${x + 5} ${y + 7}l${width - 10} 2 1 ${height - 16}-${width - 11} 1Z`, 'light', .38) +
      fill(`M${x + 5} ${y + height - 34}q20-13 ${width - 8}-5v31l-${width - 8} 1Z`, 'pine', .12) + trees,
      pen(outer, 1.15, .74) + pen(`M${x + 5} ${y + 6}v${height - 7}m${width - 9}-${height - 7} 1 ${height - 8}M${x + width / 2} ${y + 3}v${height - 4}M${x + 2} ${y + height * .49}l${width - 3} 1M${x - 4} ${y + height + 4}l${width + 12}-1`, .8, .63) +
      pen(`M${x + 7} ${y + height + 8}l${width - 3}-1m-${width - 10}-4 2-12M${x + (mirrored ? width - 4 : 2)} ${y + 10}l1 42`, .55, .5, 'wood')
    );
  }

  function stove(x, y, scale) {
    return `<g transform="translate(${x} ${y}) scale(${scale})">` + layers(
      fill('M-18-59Q0-67 19-59L22-8Q0 2-23-8Z', 'indigo', .37) +
      fill('M-8-63-7-195 8-195 9-63Z', 'ink', .19),
      pen('M-7-194 7-194 8-69M-7-191-8-68M-20-64q20-9 41 0l2 7q-23 9-46 0ZM-21-56l-2 48q24 8 46 0l-2-48M-15-7l-5 16m36-17 5 16M-13-42q13-7 27 0v22q-14 7-27 0ZM-9-36l17-1m-4 10h5M-21-17q24 9 44-1', 1.05, .68) +
      pen('M-17-54l1 7m1 6 1 20m-5 1 1 8M-2-187l1 63m0 11 1 22M-10-18l8 3m5-2 8-3', .5, .48, 'ink')
    ) + '</g>';
  }

  // A single perspective model keeps the four benches facing their shared center.
  function project(x, y, z) {
    const scale = 1 / (1 + z / 900);
    return [+(360 + x * scale).toFixed(2), +(427 - (y * .66 + z * .57) * scale).toFixed(2)];
  }

  function handPolygon(points, key) {
    const random = randomFor(key);
    const pts = points.map(([x, y]) => [x + (random() - .5) * 1.0, y + (random() - .5) * 1.0]);
    let d = `M${pts[0].join(' ')}`;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      d += `Q${(a[0] + b[0]) / 2 + (random() - .5) * 2.4} ${(a[1] + b[1]) / 2 + (random() - .5) * 1.9} ${b.join(' ')}`;
    }
    return d + 'Z';
  }

  function timber(x0, x1, y0, y1, z0, z1, color, key) {
    const side = (x0 + x1) / 2 < 0 ? x1 : x0;
    const faces = [
      [[side, y0, z0], [side, y0, z1], [side, y1, z1], [side, y1, z0]],
      [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]],
      [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]]
    ];
    const paths = faces.map((face, i) => handPolygon(face.map(v => project(...v)), `${key}-${i}`));
    const strength = .56 + (1 - z0 / 700) * .32;
    let grain = '';
    if (x1 - x0 > 80) {
      for (let i = 0; i < 3; i++) {
        const yy = y0 + (y1 - y0) * (.23 + i * .22);
        const a = project(x0 + 9 + i * 7, yy, z0), b = project(x1 - 17 - i * 14, yy, z0);
        grain += pen(`M${a.join(' ')}q${(b[0] - a[0]) * .43} ${(b[1] - a[1]) * .35 - .5} ${b[0] - a[0]} ${b[1] - a[1]}`, .45, .46, 'wood');
      }
    } else if (z1 - z0 > 80) {
      for (let i = 0; i < 3; i++) {
        const xx = x0 + (x1 - x0) * (.2 + i * .24);
        const a = project(xx, y1, z0 + 16), b = project(xx, y1, z1 - 14 - i * 20);
        grain += pen(`M${a.join(' ')}Q${(a[0] + b[0]) / 2 + .9} ${(a[1] + b[1]) / 2} ${b.join(' ')}`, .5, .45, 'wood');
      }
    }
    if (x1 - x0 > 80 && y1 - y0 > 20) {
      const a = project(x0 + 5, y0 + 3, z0), b = project(x1 - 8, y0 + 3, z0);
      const c = project(x0 + 18, y1 - 6, z0), d = project(x0 + 45, y1 - 7, z0);
      grain += pen(`M${a.join(' ')}Q${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2 - .8} ${b.join(' ')}`, 2.3, .2, color) +
        pen(`M${c.join(' ')}l${d[0] - c[0]} ${d[1] - c[1]}`, .55, .48);
      const knot = project(x0 + (x1 - x0) * .69, y0 + (y1 - y0) * .48, z0);
      grain += pen(`M${knot[0] - 5} ${knot[1]}q5-3 11-.2q-5 3-11 .2m3 0h4`, .42, .43, 'wood');
    }
    const long = Math.max(x1 - x0, z1 - z0) > 80;
    const mainFace = x1 - x0 > 80 ? 2 : 0;
    const face = faces[mainFace].map(v => project(...v));
    const minX = Math.min(...face.map(v => v[0])), maxX = Math.max(...face.map(v => v[0]));
    const minY = Math.min(...face.map(v => v[1])), maxY = Math.max(...face.map(v => v[1]));
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const width = maxX - minX, height = maxY - minY;
    let glaze = '', textureDef = '';
    if (long) {
      const clip = `@texture-${key}`;
      textureDef = `<defs><clipPath id="${clip}"><path d="${paths[mainFace]}"/></clipPath></defs>`;
      glaze = `<g clip-path="url(#${clip})">` +
        bloom(cx - width * .22, cy + height * .16, width * .34, Math.max(5, height * .48), color, .22, `${key}-pool-left`) +
        bloom(cx + width * .27, cy - height * .13, width * .19, Math.max(4, height * .39), 'ochre', .15, `${key}-pool-warm`) +
        bloom(cx + width * .04, cy + height * .27, width * .24, Math.max(3, height * .23), 'indigo', .12, `${key}-pool-dark`) + '</g>';
      if (y1 - y0 > 20) {
        for (let i = 0; i < 16; i++) {
          const t = i < 9 ? .025 + i * .025 : .8 + (i - 9) * .023;
          let a, b;
          if (mainFace === 2) {
            a = project(x0 + (x1 - x0) * t, y0 + 7 + i % 3, z0);
            b = project(x0 + (x1 - x0) * t + 3, y0 + 1, z0);
          } else {
            a = project(side, y0 + 7 + i % 3, z0 + (z1 - z0) * t);
            b = project(side, y0 + 1, z0 + (z1 - z0) * t + 4);
          }
          grain += pen(`M${a.join(' ')}l${b[0] - a[0]} ${b[1] - a[1]}`, .55, .58);
        }
      }
    }
    const pigment = paths.map((d, i) => fill(d, color, i === mainFace && long ? .26 : [.47, .2, .41][i])).join('') + glaze;
    const outline = paths.map((d, i) => pen(d, (i === mainFace ? 1.1 : .72) + (z0 < 120 ? .48 : 0), strength)).join('') + grain;
    // Small joints already have hand-shaped contours; reserve expensive pigment
    // filtering for the broad planks that visibly benefit from watercolor.
    return textureDef + paths.map(d => fill(d, 'paper')).join('') +
      `<g${long ? ' filter="url(#@wash)"' : ''}>${pigment}</g><g>${outline}</g>`;
  }


  function pew(position) {
    const side = position === 'left' || position === 'right';
    const near = position === 'near';
    const sign = position === 'left' ? -1 : 1;
    const components = [];
    const add = (bounds, color, name) => components.push({ bounds, color, name, depth: (bounds[4] + bounds[5]) / 2 });
    if (side) {
      const a = sign < 0 ? -270 : 218, b = sign < 0 ? -218 : 270;
      for (const z of [128, 399]) for (const xx of [a + 5, b - 14]) add([xx, xx + 9, 0, 49, z, z + 10], 'wood', `leg-${xx}-${z}`);
      add([a, b, 44, 52, 117, 432], 'ochre', 'seat');
      const bx = sign < 0 ? a - 3 : b - 6;
      for (const z of [129, 402]) add([bx, bx + 9, 47, 134, z, z + 9], 'wood', `post-${z}`);
      add([bx - 2, bx + 11, 69, 132, 115, 432], 'pine', 'back');
    } else {
      const a = near ? -207 : -187, b = near ? 207 : 187;
      const front = near ? 45 : 460, rear = near ? 112 : 525;
      for (const x of [a + 12, b - 22]) for (const z of [front + 6, rear - 14]) add([x, x + 10, 0, 48, z, z + 10], 'wood', `leg-${x}-${z}`);
      add([a, b, 44, 52, front, rear], 'ochre', 'seat');
      const back = near ? 31 : 531;
      for (const x of [a + 10, b - 17]) add([x, x + 9, 46, 134, back, back + 9], 'wood', `post-${x}`);
      add([a - 2, b + 2, 69, 132, back - 1, back + 11], 'pine', 'back');
    }
    // Later, closer pieces occlude seats and joints; the near back is drawn last.
    components.sort((a, b) => b.depth - a.depth || a.bounds[2] - b.bounds[2]);
    return components.map(({ bounds, color, name }) => timber(...bounds, color, `${position}-${name}`)).join('');
  }

  function square(missing = false) {
    return pew('far') + pew('left') + pew('right') + (missing ? '' : pew('near'));
  }

  function pine(x, y, scale = 1, angle = 0) {
    const random = randomFor(`pine-${x}-${y}`);
    const shoots = [[-8,3,23,-28],[14,0,48,25],[35,-3,70,-34],[63,-5,100,22],[88,-6,126,-28],[116,-5,155,12],[128,-5,156,-12]];
    let needles = '', puddles = '';
    shoots.forEach(([ax, ay, bx, by], branch) => {
      const dx = bx-ax, dy = by-ay, length = Math.hypot(dx, dy), nx = -dy/length, ny = dx/length;
      needles += pen(`M${ax} ${ay}Q${ax+dx*.65} ${ay+dy*.39} ${bx} ${by}`, .55, .75, 'wood');
      for (let i=0; i<8; i++) {
        const t=.14+i*.105, px=ax+dx*t, py=ay+dy*t;
        for (const side of [-1,1]) {
          const spread=5+random()*7, forward=7+random()*7;
          const ex=px+dx/length*forward+nx*spread*side, ey=py+dy/length*forward+ny*spread*side;
          needles += pen(`M${px.toFixed(1)} ${py.toFixed(1)}Q${(px+dx/length*5+nx*spread*side*.7).toFixed(1)} ${(py+dy/length*5+ny*spread*side*.7).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`, .42+random()*.26, .55+random()*.3, i%3===0?'ink':'pine');
          if (i%3===1) puddles += fill(`M${px.toFixed(1)} ${py.toFixed(1)}Q${(px+nx*spread*side*.7).toFixed(1)} ${(py+ny*spread*side*.7).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}L${(px+dx/length*4).toFixed(1)} ${(py+dy/length*4).toFixed(1)}Z`, 'pine', .2);
        }
      }
      puddles += bloom(ax+dx*.64,ay+dy*.62,11,8,'pine',.13,`pine-pool-${branch}`);
    });
    return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">` + layers(puddles,
      pen('M-31 5Q8-2 49-4T145-5', 1.15, .81, 'wood') +
      pen('M-25 6Q24 0 60-3m25-1 36-1', .42, .55) + needles) + '</g>';
  }

  function cone(x, y, scale = 1) {
    const shell='M0-26Q9-25 14-13Q24 1 16 16Q10 31-4 27Q-20 21-19 7Q-20-13-6-24Z';
    const random=randomFor(`cone-${x}-${y}`);
    let scales='', pigment='';
    for (let row=0; row<7; row++) {
      const yy=-20+row*6.1, half=3.5+Math.sin((row+.7)/7*Math.PI)*12;
      for (let col=-1; col<2; col++) {
        const xx=col*half*.66+(row%2?2:-1), width=4+random()*3;
        scales+=pen(`M${(xx-width).toFixed(1)} ${yy.toFixed(1)}q${width.toFixed(1)} ${(5+random()*3).toFixed(1)} ${(width*2).toFixed(1)} -.6m${(-width*1.6).toFixed(1)} -1.6q${(width*.5).toFixed(1)} 3.5 ${width.toFixed(1)} .8`,.45+random()*.22,.7+random()*.15);
        if(col<1) pigment+=fill(`M${xx-width} ${yy}q${width} 7 ${width*2} 0l-${width*.6} 6-${width*.9}-1Z`,'rust',.24);
      }
    }
    return `<g transform="translate(${x} ${y}) rotate(22) scale(${scale})">` + layers(
      fill(shell,'ochre',.28)+fill('M-5-24Q-24-5-15 16Q-11 25-3 27L1 16Q-9 1-5-24Z','wood',.38)+pigment,
      pen('M-5-24Q-19-16-19 4m1 8Q-13 28-1 27m8-1q9-7 10-17M14-14q-4-11-13-12',.93,.88)+scales+
      pen('M-3-26q1-4 6-5',.8,.71,'wood'))+'</g>';
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
    const left='M-1 10Q-65-16-130 5L-128 112Q-66 90-2 115Q-8 63-1 10Z';
    const right='M1 10Q59-17 126 1L132 108Q69 89-2 115Q5 59 1 10Z';
    const cover='M-140 13Q-71-13-1 16Q63-12 137 9L143 121Q69 100-2 126Q-71 104-136 128Z';
    const clip=`@texture-open-book-${x}-${y}-${variation}`;
    let notes='', edgeHatching='';
    for(let row=0;row<3;row++) notes+=musicLine(-112,31+row*25,88,row+variation)+musicLine(20,29+row*25,90,row+variation+1);
    for(let i=0;i<18;i++) {
      const yy=17+i*5.4;
      edgeHatching+=pen(`M-126 ${yy.toFixed(1)}l${4+i%3} -2M128 ${(yy-2).toFixed(1)}l-5 -2`,.32,.39,'wood');
    }
    return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">`+
      `<defs><clipPath id="${clip}"><path d="${left}${right}"/></clipPath></defs>`+
      layers(fill(cover,'rust',.42)+fill('M-136 118Q-72 95-2 120Q73 95 139 112L143 121Q69 100-2 126Q-71 104-136 128Z','wood',.25),
        pen('M-139 13l3 94m0 11 0 10Q-71 104-2 126Q69 100 143 121l-6-110',1.15,.86))+
      fill(left,'paper')+fill(right,'paper')+
      layers(`<g clip-path="url(#${clip})">`+
        fill('M-1 10Q-8 32-5 63L-2 115-13 110Q-22 58-7 6Z','wood',.14)+
        fill('M-131 5Q-117 10-110 7L-113 103-127 112Z','ochre',.16)+
        bloom(108,104,37,14,'ochre',.12,`page-foot-${variation}`)+
        bloom(-84,5,34,10,'ochre',.11,`page-head-${variation}`)+
        bloom(104,35,15,19,'wood',.055,`page-side-${variation}`)+'</g>',
        pen('M-1 10Q-62-15-130 5l1 63m1 16v28Q-69 91-2 115Q68 89 132 108l-4-71m-2-18V1Q63-16 1 10',.92,.82)+
        pen('M-1 12q-7 50-1 100M-127 119q62-24 122 1M6 119q61-23 126-5M-122 122q58-23 119 1M7 123q57-22 126-5',.42,.63)+
        pen('M-116 18q39-12 87-2M22 14q42-11 88-1M110 100l12-3 5 10m-5-9 1 7M-123 7l8 1-4 7',.43,.59,'wood')+
        edgeHatching+notes)+
      pen('M-136 38l2 55M138 52l1 45M-128 112q48-16 74-11M24 113q42-14 63-11',.4,.53,'rust')+'</g>';
  }

  function closedBook(x, y, scale = 1, angle = 0) {
    const cover='M-130-25Q-118-27-109-27L73-46Q79-47 85-43L131-18Q138-13 130-10L-66 19Q-75 21-81 15L-128-16Q-136-20-130-25Z';
    const spine='M-128-18Q-100-2-79 13Q-74 19-74 28L-73 50Q-78 55-83 51L-129 17Q-136 10-134-1Z';
    const pages='M-71 20Q32 5 130-10L128 20Q38 29-72 48Q-68 34-71 20Z';
    const bottom='M-132 10-76 47Q-69 51-63 49L128 20Q140 19 141 27L-69 61Q-76 63-84 57L-138 19Z';
    const clip=`@texture-closed-book-${x}-${y}`;
    const random=randomFor(`binding-${x}-${y}`);
    let details='', grain='';
    for(let i=0;i<8;i++) {
      const yy=23+i*3.1;
      details+=pen(`M${-69+i%2} ${yy.toFixed(1)}Q${(7+i%3*4).toFixed(1)} ${(yy-9).toFixed(1)} ${121+i%3*3} ${(yy-30).toFixed(1)}`, .28+(i%3)*.08,.54+(i%2)*.12,'wood');
    }
    for(let i=0;i<37;i++) {
      const px=-97+random()*193, py=-13+(px+97)*-.115+random()*18;
      grain+=pen(`M${px.toFixed(1)} ${py.toFixed(1)}q${(2+random()*4).toFixed(1)} -1.7 ${(4+random()*4).toFixed(1)} -.5`,.26,.22,i%3===0?'ochre':'ink');
    }
    // A few dark nicks and pooled edges carry the age; broad pale areas survive.
    return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">`+
      `<defs><clipPath id="${clip}"><path d="${cover}"/></clipPath></defs>`+
      fill(bottom,'paper')+fill(pages,'paper')+layers(
        fill(bottom,'rust',.34)+fill(pages,'light',.37)+fill(spine,'pine',.68)+fill(cover,'pine',.53)+
        `<g clip-path="url(#${clip})">`+
        fill('M-130-25Q-102-28-78-31L73-46 89-36Q-10-24-80-15L-72 17-83 12Z','pine',.13)+
        bloom(-79,-14,39,17,'pine',.3,'binding-spine-pool')+
        bloom(73,-27,55,13,'indigo',.18,'binding-corner-pool')+
        bloom(15,0,46,9,'ochre',.1,'binding-dry-edge')+'</g>'+
        fill('M-73 42Q34 27 126 14L128 20Q38 29-72 48Z','ochre',.23)+
        fill('M-130-3Q-105 8-77 33L-77 45Q-104 22-132 12Z','indigo',.18),
        pen('M-128-25Q-117-28-109-27L73-46q6-1 12 3l46 25q7 5-1 8L-66 19q-9 2-15-4l-47-31',1.08,.86)+
        pen('M-127-15Q-136-9-133 7l1 6 49 39q5 5 10-2l1-27M-72 50q103-17 200-30l2-30M-134 13l-4 6 54 38q8 6 15 4l210-34q-2-6-9-7',1.48,.87)+
        pen('M-112-23 75-41 118-16-70 12Z M-108-20 74-38m-3 1 37 20M-101-16l-7 1 7 3m166-26 4 3 7 1M-74 7l3-4-8-1M104-16l-6 1 2 3',.54,.72,'ochre')+
        pen('M-125-13q-6 9-3 18M-118-7q-7 8-4 19M-100 6q-6 8-4 18M-82 18q-5 8-3 18',.85,.63,'ochre')+
        pen('M-127-8l1 9m5-7-1 11m4-8v12M-102 11l-1 9m5-7 1 12M-82 29v9m4-6 1 12',.38,.57)+
        pen('M-47-17l66-9m-55 13 45-6m-23 9 31-5',.63,.69,'ochre')+
        pen('M-124-23l9-1m181-20 9-1M123-14l6-1m-193 32 9-1M-128 16l7 4M-79 53l5 3m7 1 18-3',.65,.88)+
        details+grain)+
      fill('M34 35 38 65 48 57 56 61 53 32Z','rust',.45)+
      pen('M34 35l4 30 10-8 8 4-3-29M39 39l4 17',.7,.75,'rust')+'</g>';
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
    bloom(310, 405, 202, 14, dark ? 'indigo' : 'wood', dark ? .1 : .075, `${key}-floor`) +
    bloom(528, 373, 69, 17, 'pine', .07, `${key}-side`), '');

  function table(key, deep = false) {
    return layers(
      fill('M115 316Q207 296 319 319T613 304L633 393Q512 417 410 397T104 405Z', 'wood', deep ? .16 : .09) +
      bloom(383, 378, 225, 25, 'ochre', .14, `${key}-table`) +
      bloom(454, 381, 126, 18, 'wood', deep ? .19 : .1, `${key}-pool`),
      pen('M117 346q68-12 110-5m12-1q156-18 258-5m15 0 76-7M122 381q79-3 111-10m19-3q76-3 126-6m14 0 72-5m13 0 92-5M118 402l24-3m9-1 55-5m224 8 40-3m17-1 97-8', .55, .38, 'wood') +
      pen('M153 365q16-11 37-4q-22 1-37 4m6-1 20-1M504 385q12-8 36-5m-30 3 14-2', .45, .4, 'wood')
    );
  }

  function scrap(x, y, scale = 1, angle = 0, variant = 0) {
    return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">` +
      fill('M-44-15 38-20 43 22 34 25 29 31 18 25 7 32-4 26-19 32-27 25-41 30Z', 'light', .6) +
      musicLine(-32, -4, 64, variant) + pen('M-39-13 37-19M40 22l-6 3-5 6-11-6-11 7m-29-11-8 6', .55, .58, 'wood') + '</g>';
  }

  function leaves(x, y, scale = 1, angle = 0) {
    let pigment = '', lines = pen('M-22 7Q38-8 119-39M30-8l-4-30M62-18l18 16', .75, .55, 'wood');
    for (let i = 0; i < 8; i++) {
      const xx = i * 15, yy = -i * 5;
      const d = i % 2 ? `M${xx} ${yy}q-14-23 4-31q13 16-4 31Z` : `M${xx} ${yy}q4 20 24 16q-1-19-24-16Z`;
      pigment += fill(d, 'pine', .17 + i % 3 * .03);
      lines += pen(d, .55, .49, 'pine') + pen(`M${xx} ${yy}l${i % 2 ? 3 : 14} ${i % 2 ? -21 : 10}`, .35, .38, 'wood');
    }
    return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">${layers(pigment, lines)}</g>`;
  }

  function lectern(x, y, scale = 1) {
    return `<g transform="translate(${x} ${y}) scale(${scale})">` + layers(
      fill('M-90-80 46-107 103-74-38-42Z', 'wood', .25) +
      fill('M-9-50 9-54 17 66 0 74-17 70Z', 'pine', .32) +
      fill('M-52 79 48 62 72 72-42 94-65 88Z', 'wood', .28),
      pen('M-90-80 46-107 103-74-38-42Z M-89-80l1 8 49 39 143-33v-8M-38-42v9', 1.2, .88) +
      pen('M-9-45Q-4-12-12 20L-17 70 0 74 17 66Q9 23 9-49M-52 79 48 62 72 72-42 94-65 88Z', 1.2, .82) +
      pen('M-80-77l43 30 108-25M-8 61l3-34m7-19-1-25M-44 80l41-7m17-4 27-5m-63 23 64-12', .55, .59, 'wood')
    ) + '</g>';
  }

  const scenes = {
    title() {
      return table('title') + candle(205, 290, 1.68) + closedBook(409, 312, 1.36, -8) +
        scrap(535, 374, 1, -17, 2) + pine(248, 384, 1.14, -15) +
        pine(238, 384, .76, -135) + cone(366, 408, .88);
    },
    meetinghouse() {
      return room() + ground('meeting') + square() + closedBook(337, 291, .37, -9) + candle(406, 287, .42);
    },
    wrongPages() {
      return layers(
        fill('M106 133Q295 110 620 126L603 219 120 212Z', 'ochre', .085) +
        bloom(157, 217, 37, 79, 'pine', .11, 'pages-left'),
        pen('M135 134q119-7 206-2m25 0 220 1M119 166l41 0m16-1 74 0m228 0 70 1M112 218l24-2m423 2 40 2', .6, .37, 'wood')) +
        `<g transform="translate(-144 -27) scale(1.4)">${pew('far')}</g>` +
        book(212, 240, .48, -7, 0) + book(370, 241, .48, 3, 2) + book(529, 245, .46, 8, 3) +
        pen('M257 303q9 14 1 30l9-7 5 5-1-29M494 302q-7 15-3 25', .95, .66, 'rust') +
        layers(bloom(356, 330, 201, 16, 'wood', .09, 'pages-shadow'), '');
    },
    thumbprint() {
      let ridges = '';
      for (let i = 0; i < 9; i++) ridges += pen(`M${-20 - i * 1.8} ${8 + i * 2}C${-34 - i * 2} ${-32 - i * 3} ${31 + i * 2} ${-43 - i * 3} ${24 + i * 2} ${5 + i * 3}Q${17 + i * 2} ${31 + i * 2} ${-5 - i} ${27 + i * 2}`, .8, .5);
      return leaves(135, 112, 1.18, -9) + leaves(591, 133, .83, 166) + table('thumb') +
        book(355, 152, 1.65, -8) +
        `<g transform="translate(407 272) rotate(24)">${layers(bloom(0, 0, 34, 47, 'ink', .49, 'thumb-ink'), ridges)}</g>` +
        pen('M116 377l72-9m342-59 36-7m-31 12 25-5', .55, .43, 'rust');
    },
    emptyChair() {
      return `<g opacity=".56" transform="translate(74 6) scale(.82)">${room()}${pew('far')}</g>` +
        layers(fill('M247 335Q302 350 477 409L429 425 228 374Z', 'indigo', .14) +
          bloom(265, 394, 111, 15, 'wood', .11, 'chair-contact'), '') +
        chair(282, 321, 1.39) +
        layers(fill('M304 196Q318 187 329 199L340 260 332 271 324 264 316 278 307 269Z', 'rust', .47),
          pen('M304 196q14-9 25 3l11 61m-31-58 10 60m-4-58 11 59m-4-61 12 56M307 269l9 9 8-14 8 7 8-11', .7, .69, 'rust')) +
        candle(499, 353, .94);
    },
    pencilNote() {
      return table('pencil') + book(344, 147, 1.66, 5) +
        layers(fill('M398 332 560 181 568 191 406 342 384 351Z', 'ochre', .53),
          pen('M398 332 560 181 568 191 406 342 384 351Z M398 332l8 10M552 189l8 9M560 181l7-6 8 9-7 7', 1.0, .86) +
          pen('M403 333 561 189M385 350l8-5M410 334l143-137', .55, .66, 'wood')) +
        pen('M189 308q7-13 10-1t9-5q7-7 6 3t12-3m-40 18q16-5 44 1M194 342q10-4 36 0', .75, .74, 'wood') +
        scrap(564, 379, .56, 18, 3);
    },
    floorboards() {
      let grain = '';
      for (let i = 0; i < 9; i++) {
        const a = 114 + i * 54, b = 86 + i * 68;
        grain += pen(`M${a} 258Q${a + 13} 342 ${b} 418`, .75, .55, 'wood') +
          pen(`M${a + 5} 281q7 42 1 61m-1 9-4 32`, .4, .38, 'wood');
      }
      return layers(fill('M110 244Q357 229 606 246L642 414 83 424Z', 'wood', .11) +
        bloom(425, 292, 172, 33, 'indigo', .11, 'below-bench'), '') +
        `<g transform="translate(-126 -247) scale(1.35)">${pew('near')}</g>` +
        layers(fill('M207 337Q353 314 502 331L514 341Q362 326 202 349Z', 'ink', .5) +
          bloom(359, 339, 127, 14, 'pine', .16, 'floor-voice'),
          grain + pen('M204 337q132-23 298-6M202 350q157-26 312-9M143 392l71-6m269-2 82-6', .8, .61) +
          pen('M437 385q19-15 44-5q-15 6-39 9m4-3 24-3', .55, .56, 'wood')) +
        candle(161, 369, .94) + scrap(551, 379, .65, 13, 1);
    },
    heavyBook() {
      return table('heavy', true) + candle(184, 268, 1.18) +
        closedBook(374, 296, 1.58, -8) + pine(493, 374, .69, -17) + cone(572, 372, .61) +
        pen('M192 390q64-8 128-11l18 4 22-8 29 4 37-9 73 2M241 399l56-4m126-12 63-7', .75, .54, 'wood');
    },
    threeBenches() {
      return `<g transform="translate(0 -12)">${room(true)}${ground('missing')}${square(true)}</g>` +
        candle(302, 295, .29) + candle(420, 295, .29) + candle(279, 344, .34) + candle(446, 344, .34) +
        pen('M260 394l16-1m153-1 17 1M259 397l3 9m178-9-3 10', .6, .4, 'wood');
    },
    closedBook() {
      return `<g opacity=".43" transform="translate(20 -13) scale(.9)">${room(true)}${pew('far')}${pew('left')}</g>` +
        layers(bloom(437, 410, 125, 15, 'indigo', .13, 'lectern-contact'), '') +
        lectern(425, 302, 1.13) + candle(520, 213, .45) + closedBook(424, 205, .77, -8);
    },
    wrongShadow() {
      const shadow = 'M370 282Q400 250 395 225L383 212 383 197 369 195Q366 189 378 180L379 160Q386 117 428 126Q463 132 458 169L453 202Q482 225 518 239L548 319Z';
      let scratches = '';
      for (let i = 0; i < 19; i++) scratches += pen(`M${410 + i * 5} ${211 + i * 2}l-9 29m5-15-7 23`, .55, .2, 'paper');
      return layers(fill('M218 134Q428 104 569 147L598 329 280 330Z', 'ochre', .08),
        pen('M225 174l69-6m177-8 70 7M239 211l48-4m186 4 59 4M258 258l81-3m157 11 45 5', .55, .33, 'wood')) +
        `<defs><clipPath id="@texture-shadow"><path d="${shadow}"/></clipPath></defs>` +
        `<g class="art-shadow">${layers(fill(shadow, 'ink', .57) +
          `<g clip-path="url(#@texture-shadow)">${bloom(441, 254, 85, 57, 'indigo', .24, 'shadow-edge')}</g>`,
          pen('M378 180l-9 12 14 5v15l12 13M453 202q34 28 65 37', .75, .47) +
          `<g clip-path="url(#@texture-shadow)">${scratches}</g>`)}</g>` +
        table('shadow', true) + candle(213, 325, 1.57, false) + closedBook(435, 352, 1.21, -9);
    },
    placeInSquare() {
      return `<g opacity=".68">${room(true)}</g>` + ground('last') + square() +
        layers(fill('M306 274Q350 266 410 281L443 321Q373 330 296 317Z', 'light', .085), '') +
        pen('M324 302l13-2m60 3 12 2M315 315l14-1m68 2 13 2', .55, .37, 'wood') + candle(459, 307, .58);
    }
  };

  function wrap(scene, label) {
    // Prefix every paint server: title and story SVGs coexist in the game DOM.
    const id = `hollow-art-${scene}`;
    const seed = Object.keys(scenes).indexOf(scene) + 17;
    const body = scenes[scene]();
    return `<svg class="programmatic-art" viewBox="0 0 720 468" role="img" aria-label="${escapeAttribute(label)}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="${id}-wash" x="-12%" y="-16%" width="124%" height="132%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".025 .045" numOctaves="3" seed="${seed}" result="flow"/>
          <feDisplacementMap in="SourceGraphic" in2="flow" scale="5" xChannelSelector="R" yChannelSelector="G" result="spread"/>
          <feTurbulence type="fractalNoise" baseFrequency=".48" numOctaves="3" seed="${seed + 3}" result="grain"/>
          <feColorMatrix in="grain" type="saturate" values="0"/>
          <feComponentTransfer result="granulation">
            <feFuncR type="table" tableValues=".82 1"/><feFuncG type="table" tableValues=".82 1"/><feFuncB type="table" tableValues=".82 1"/><feFuncA type="table" tableValues="1 1"/>
          </feComponentTransfer>
          <feComposite in="spread" in2="granulation" operator="arithmetic" k1="1" k2="0" k3="0" k4="0"/>
        </filter>
        <filter id="${id}-pen" x="-3%" y="-3%" width="106%" height="106%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".14" numOctaves="2" seed="8" result="tooth"/>
          <feDisplacementMap in="SourceGraphic" in2="tooth" scale=".85" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
      <g stroke-linecap="round" stroke-linejoin="round">${body}</g>
      ${flecks(scene)}
    </svg>`.replaceAll('#@wash', `#${id}-wash`).replaceAll('#@pen', `#${id}-pen`).replaceAll('@texture-', `${id}-texture-`);
  }

  window.HollowArt = {
    title() { return wrap('title', 'An ink drawing with watercolor washes of a green songbook, a candle, pine branches, and a torn shape-note score.'); },
    story(scene, label) {
      const key = Object.hasOwn(scenes, scene) && scene !== 'title' ? scene : 'meetinghouse';
      return wrap(key, label);
    }
  };
})();
