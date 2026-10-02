'use strict';

/* Deterministic, uneasy watercolor sketches. Pigment and pen are separate layers:
   bleeding washes sit beneath broken, pressured ink; forms dissolve into paper.
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

  function scrawl(points, key, weight = 1.4, opacity = .8, color = 'ink') {
    const random = randomFor(key);
    let marks = '';
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1];
      const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy);
      const pieces = length > 95 ? 3 : 1;
      for (let j = 0; j < pieces; j++) {
        if (random() < .19) continue;
        const start = j / pieces + random() * .13;
        const end = Math.min(.98, (j + .72 + random() * .22) / pieces);
        const x = a[0] + dx * start, y = a[1] + dy * start;
        const xx = a[0] + dx * end, yy = a[1] + dy * end;
        marks += pen(`M${x} ${y}Q${(x + xx) / 2 + (random() - .5) * 9} ${(y + yy) / 2 + (random() - .5) * 10} ${xx} ${yy}`, weight * (.55 + random()), opacity * (.65 + random() * .35), color);
        if (length > 80 && random() > .43) marks += pen(`M${x - 3} ${y + 4}q${(xx - x) * .5} ${(yy - y) * .7 - 5} ${(xx - x) * .82} ${yy - y + 2}`, weight * .32, opacity * .48, color);
      }
    }
    return marks;
  }

  function room(dark = false) {
    const washes = bloom(199, 210, 115, 102, 'indigo', dark ? .31 : .24, 'left-wall-soak') +
      bloom(223, 155, 79, 70, 'pine', .22, 'wall-mold') +
      bloom(180, 291, 79, 48, 'ink', .18, 'low-wall-ink') +
      bloom(350, 166, 102, 49, 'ochre', .12, 'thin-light') +
      bloom(479, 232, 83, 64, 'wood', .13, 'dry-right-wall') +
      bloom(361, 349, 157, 46, 'wood', .095, 'floor-water') +
      fill('M184 242Q166 288 185 317L190 339 200 334Q187 307 206 275Z', 'indigo', .19) +
      fill('M148 189Q133 236 145 281L141 303 151 298Q161 248 157 210Z', 'ink', .15);
    const lines = scrawl([[122, 111], [191, 91], [284, 106], [360, 88]], 'room-head', 1.6, .5) +
      scrawl([[180, 128], [169, 230], [116, 332]], 'room-left', 1.4, .51) +
      pen('M121 224q19-9 38-5m-29 12 30-11m-35 22 27-12M209 156l-11 19m10-5-10 21M454 136q28-5 51 4m-11 94 37 10', 1.1, .38) +
      pen('M231 291q29-13 49-3m35 19q30-2 59 10M402 370q41-8 80 5m-287 20q32-12 77-11M295 336q31-11 66 1', .85, .41, 'wood');
    return layers(washes, lines) +
      `<g transform="rotate(-5 268 161)">${windowPlate(235, 103, 58, 93, false)}</g>` +
      `<g opacity=".43" transform="rotate(7 471 163)">${windowPlate(452, 122, 51, 82, true)}</g>` +
      `<g opacity=".58">${stove(545, 267, .53)}</g>`;
  }

  function windowPlate(x, y, width, height, mirrored) {
    const edge = [[x,y+5],[x+width,y],[x+width-3,y+height],[x-4,y+height+3],[x,y+5]];
    return layers(
      fill(`M${x+3} ${y+3}q${width*.6}-7 ${width-6}-1l-3 ${height-8}q-${width*.6}-4-${width-5} 7Z`, 'light', .36) +
      bloom(x+width*.3,y+height*.86,width*.45,height*.18,'pine',.23,`window-${x}`) +
      fill(`M${x+10} ${y+height-7}q-3-27 8-55q7 31 4 48m10-3q-2-25 10-39l-1 43Z`, 'ink', .15),
      scrawl(edge, `window-edge-${x}`, 2, .68) +
      pen(`M${x+width*.46} ${y+8}q-2 28 1 ${height-12}M${x+6} ${y+height*.51}q${width*.4}-5 ${width-13}-1`, 1.05, .45) +
      pen(`M${x-6} ${y+height+6}q${width*.4}-3 ${width+9}-5m-${width-6} 5 21-2`, 2.3,.57)) ;
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
    const pts = points.map(([x, y]) => [x + (random() - .5) * 5.2, y + (random() - .5) * 4.7]);
    let d = `M${pts[0].join(' ')}`;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      d += `Q${(a[0] + b[0]) / 2 + (random() - .5) * 8.2} ${(a[1] + b[1]) / 2 + (random() - .5) * 8.7} ${b.join(' ')}`;
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
    const pigment = paths.map((d, i) => fill(d, color, i === mainFace && long ? .39 : [.54, .17, .38][i])).join('') + glaze;
    const main = faces[mainFace].map(v => project(...v));
    let outline = scrawl([main[1], main[2], main[3]], `${key}-contour`, long ? 2.1 : 1.3, strength);
    if (long) {
      outline += scrawl([main[0], main[1]], `${key}-lower`, 1.4, .51) +
        pen(`M${main[2][0] - 4} ${main[2][1] + 3}q5-2 8-2m-8 4 12-2M${main[3][0] + 1} ${main[3][1] + 4}l7-2`, 3.3, .8);
      const random = randomFor(`${key}-scrapes`);
      for (let i = 0; i < 4; i++) {
        const t = i < 3 ? .06 + random() * .17 : .86 + random() * .07, xx = main[3][0] + (main[2][0] - main[3][0]) * t;
        const yy = main[3][1] + (main[2][1] - main[3][1]) * t;
        outline += pen(`M${xx} ${yy + 5 + random() * 13}q${3 + random() * 9} ${-2 - random() * 4} ${6 + random() * 10} ${-2 - random() * 6}`, .8 + random() * 1.3, .3 + random() * .32);
      }
    }
    const seep = long ? bloom(cx - width * .13, cy + height * .3, Math.max(5, width * .5), Math.max(6, height * .72), color, .2, `${key}-escaped-paint`) : '';
    return textureDef + (long ? layers(seep, '') : '') + paths.map(d => fill(d, 'paper')).join('') +
      `<g${long ? ' filter="url(#@wash)"' : ''}>${pigment}</g><g>${outline}${grain}</g>`;
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
    const angles = { far: -3.8, left: 2.4, right: -4.2, near: -2.1 };
    return `<g transform="rotate(${angles[position]} 360 290)">` + components.map(({ bounds, color, name }) => timber(...bounds, color, `${position}-${name}`)).join('') + '</g>';
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
    // A book remembered by hand: its leaves buckle, the gutter swallows ink,
    // and the score follows the page instead of a drafting ruler.
    const left='M-6 10Q-54-23-108-9L-136 9Q-131 46-140 72L-127 112Q-64 82-1 120Q-17 66-6 10Z';
    const right='M-3 12Q62-20 125-4L140-14Q123 40 136 92L128 110Q58 83-1 120Q11 59-3 12Z';
    const cover='M-144 12Q-100-18-7 17Q58-14 144-3L151 119Q65 99-2 134Q-68 108-142 130L-147 89Z';
    const random=randomFor(`raw-open-${x}-${y}-${variation}`);
    let score='', bites='';
    for(const side of [-1,1]) {
      const sx=side<0?-119:20;
      for(let row=0;row<3;row++) {
        const yy=29+row*25+(side<0?0:-4), width=86+random()*7;
        for(let staff=0;staff<4;staff++) {
          const sy=yy+staff*4.8;
          score+=pen(`M${sx} ${sy.toFixed(1)}q${(26+random()*7).toFixed(1)} ${(side<0?-7:-5)} ${(width*.52).toFixed(1)} -3t${(width*.48).toFixed(1)} ${2+row%2}`, .36+random()*.3, .43+random()*.22);
        }
        for(let note=0;note<5;note++) {
          const nx=sx+10+note*16+random()*3, ny=yy+((note+row+variation)%3)*4.5-1;
          const shapes=[`M${nx} ${ny}l6 3-7 2Z`,`M${nx} ${ny}q5-3 6 1q-4 5-7 1Z`,`M${nx} ${ny}l5-1 1 5-6 1Z`,`M${nx} ${ny}l3-3 4 3-4 4Z`];
          score+=fill(shapes[(row+note+variation)%4],'ink',.69)+pen(`M${nx+5} ${ny+1}q-1-7 ${note%2?1:-1}-14`,.62+random()*.4,.74);
        }
      }
    }
    for(let i=0;i<12;i++) {
      const yy=22+i*7.2;
      bites+=pen(`M-132 ${yy.toFixed(1)}l${3+i%4} -3m${-4-i%3} 2 2 6M130 ${(yy-8).toFixed(1)}l-3 ${3+i%2}`, .48, .51, 'wood');
    }
    return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">`+
      layers(fill(cover,'rust',.5)+fill('M-144 115Q-63 94-2 124Q57 93 146 112L151 119Q65 99-2 134Q-68 108-142 130Z','ink',.18),
        pen('M-145 20l-2 42m1 10 3 15m-1 31 4 12q22-8 45-10m25-2q36 0 68 16M17 124q44-17 65-16m33 6 37 5-7-74',2.4,.88)+
        pen('M-143 128l-4-12m3 9 5-28M141 18l5 42',.65,.55))+
      fill(left,'paper')+fill(right,'paper')+
      layers(fill('M-6 10Q-22 58-1 120L-14 111Q-31 79-19 29Z','wood',.3)+
        fill('M-127-7Q-134 30-136 58L-125 90-122 26-111-11Z','ochre',.18)+
        bloom(118,11,21,18,'ochre',.12,'raw-page-ear')+
        bloom(-91,104,35,13,'rust',.1,'raw-page-foot')+
        fill('M-2 104Q68 79 129 105L129 110Q53 90-1 120Z','wood',.11),
        pen('M-132 6q19-10 35-11m11-4q39-4 79 19M-4 13q28-14 64-18m16-1 34 3M-138 21l4 22m-2 17-4 12 12 31M-122 110q29-14 55-13m15 4q26 3 51 19',1.55,.89)+
        pen('M138-10q-8 19-6 31m1 19q-4 34 3 52l-8 18q-12-4-25-6M83 101q-49-9-81 18',1.8,.88)+
        pen('M-6 14q-8 12-8 31m2 13q-2 21 4 39l7 23M-1 13q8 32 4 45m-4 28 3 30',2.1,.74)+
        pen('M-3 31q-9 22-2 54M-13 55l3 34m-7-8 8 30',.68,.65)+
        pen('M-128 115q20-12 41-10m14 0q31 0 69 20M8 126q32-19 71-15m10-1 43 6M-130 121q52-18 73-7m15 7 41 10M20 130l18-7m38-7 52 6',.58,.73,'wood')+
        pen('M122-4l18-10q-3 15-17 19q9-8 0-9M-138 69l10 8-3 15m1-15-7 4M119 101l10-9 6 6m-7-6 1 18',.83,.64)+
        bites+score)+
      pen('M-105 20q6-5 13-4m-11 2 14-3M102 68l9-2m-6 5 10-1M-120 87l13-3',.47,.48,'wood')+'</g>';
  }

  function closedBook(x, y, scale = 1, angle = 0) {
    const cover='M-132-25Q-115-32-98-27L19-43Q50-48 75-45L82-49Q108-29 133-18L138-9Q84-4 57 4L-53 22Q-69 28-84 17L-135-14Z';
    const spine='M-133-17Q-108-2-80 15L-78 52Q-93 55-101 40L-132 23Q-139 13-135-3Z';
    const pages='M-77 23Q33 6 133-11L127 22Q35 30-75 53Q-71 38-77 23Z';
    const bottom='M-134 14-78 49-67 49Q30 33 128 22L143 32Q47 43-68 65L-83 62-143 24Z';
    const random=randomFor(`raw-binding-${x}-${y}`);
    let pagesInk='', leather='';
    for(let i=0;i<9;i++) {
      const yy=23+i*3.2;
      const start=-73+random()*5, end=116+random()*11;
      pagesInk+=pen(`M${start.toFixed(1)} ${yy.toFixed(1)}q${(23+random()*8).toFixed(1)} ${(1-random()*6).toFixed(1)} ${(63+random()*13).toFixed(1)} -10m${(6+random()*6).toFixed(1)} -1q25-8 ${(end-start-85).toFixed(1)} -11`,.4+random()*.44,.51+random()*.23,'wood');
    }
    for(let i=0;i<17;i++) {
      const yy=-10+i*3.4, px=-126+(yy+10)*1.22;
      leather+=pen(`M${px.toFixed(1)} ${yy.toFixed(1)}q-4 3 -2 ${5+i%4}m${4+i%2} -7 -1 ${4+i%3}`, .52+random()*.5,.65+random()*.18);
    }
    return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">`+
      fill(bottom,'paper')+fill(pages,'paper')+
      layers(fill(bottom,'rust',.44)+fill(pages,'light',.3)+fill(spine,'pine',.65)+fill(cover,'pine',.51)+
        fill('M-131-23Q-110-31-93-24L-103-13-81 10-74 40-96 24-132 10Z','indigo',.22)+
        bloom(75,-31,53,16,'pine',.25,'raw-binding-head')+
        bloom(-79,-8,40,17,'pine',.23,'raw-binding-heel')+
        bloom(21,-13,48,9,'ochre',.11,'raw-binding-light')+
        fill('M-72 43Q8 26 128 13L125 22Q14 38-75 53Z','ochre',.2)+
        fill('M-136 10-133 25-81 57-74 48Q-90 46-98 35Z','ink',.18),
        pen('M-133-24q14-10 32-4l23-3m11-2 25-1M-23-39l34-4m14-2 25-1 21 2 11-5M85-44q18 14 39 24l14 11-27 4M88-1 53 7m-12 0-33 6M-15 17l-38 5q-15 7-31-5L-127-9',2.35,.88)+
        pen('M-135-12q-2 8 0 19m1 8-2 11 37 22m10 6 9 5 5-4-1-16M-75 48q19-4 33-7m12-3 58-7M56 27l47-6m14-1 10 2 5-25',2.05,.9)+
        pen('M-132 15l-10 9 59 38 15 3q28-8 40-8m31-5 46-6m31-5 36-4 26-5-12-8',1.65,.86)+
        pen('M-126-21l21-2m11-2 28-3m39-6 34-2M-119-15q19 4 32 20m14 9 12 3m46-5 35-5M100-16l16 2 6 5',.72,.7,'ochre')+
        pen('M-128-12q-6 11 0 18M-116-4q-8 9-1 21M-95 13q-6 12-1 21M-79 28q-5 12-1 20',1.2,.56,'ochre')+
        pen('M-42-19l26-6m-10 8 41-9m-5 7 19-6M-44-16q12-5 18-3m24-5 12-4M64-35l9 4m-13-3 6 5M-57 7l9 1M102-9l11-5',.92,.65,'ochre')+
        pen('M-128-20l-4 9M-107-25l9 1M80-45l8 5M-80 19l4 6m-3 25 2 7M125-13l3 9m-59 64 19-5',.77,.83)+
        pen('M-81 27q-1 11 2 19M-129 22l12 5m-9-6 9 6m-6-3 14 6M-63 55q10 0 16-3m153-22 12-2',.56,.79)+
        leather+pagesInk)+
      fill('M33 38Q38 52 35 72L45 60 55 65 54 55 51 34Z','rust',.5)+
      pen('M33 39q6 14 2 33l10-12 10 5-4-31M37 43q5 11 4 17',1.15,.77,'rust')+'</g>';
  }

  function candle(x, y, scale = 1, flame = true) {
    // Light eats the contour. Wax and flame are paint shapes, with just a wick
    // and a few lost-edge traces; the holder stays faint against the paper.
    const glow = flame ? `<g class="art-glow">${layers(
      bloom(-8, -106, 30, 43, 'light', .22, 'flame-glow') +
      bloom(1, -101, 11, 20, 'light', .48, 'flame-center'), '')}</g>` : '';
    const flameOrSmoke = flame ? `<g class="art-flame">${layers(
      fill('M0-81Q-12-93-6-104L3-124Q5-108 13-101Q20-91 0-81Z', 'ochre', .52) +
      fill('M0-83Q-6-94 3-111Q2-95 7-92Z', 'light', .56) +
      fill('M-5-97Q-9-106 3-124L-1-103Z', 'rust', .1), '')}</g>` :
      `<g class="art-smoke">${pen('M1-85q-11-10-1-20m2-7q5-6-4-11', .55, .29, 'indigo')}</g>`;
    return `<g transform="translate(${x} ${y}) scale(${scale})">` + glow + layers(
      fill('M-13-71Q-5-77 4-71Q10-76 13-68L10-18Q14-4 9 2L-10 1Q-15-29-11-52Z', 'light', .82) +
      fill('M6-71 13-68 10-18 11-2 2 1Q7-22 4-45Z', 'ochre', .18) +
      fill('M-9-68Q-5-64-3-67L-5-37-8-34Z', 'light', .47) +
      bloom(-1, -6, 16, 6, 'light', .39, 'wax-foot') +
      fill('M-36 3Q-12-7 8-4L36 5 23 13-28 11Z', 'wood', .16) +
      bloom(2, 8, 32, 6, 'ochre', .13, 'holder-wash'),
      pen('M-11-61l-1 10m23 22-1 11M-9-70q4 3 7 1m5-2 6 2', .45, .25, 'wood') +
      pen('M-5-61q-1 7 3 10m1 18-2 6M6-49q-3 11 0 17', .4, .2, 'ochre') +
      pen('M0-75l1-9', .82, .78) +
      pen('M-30 4q12-5 20-4m22 0 17 4M-20 13l14 1m13 0 12-1', .6, .27, 'wood') +
      pen('M-10 14q9 2 20 0', .85, .37) +
      pen('M-31 5q-15-4-19 3m2 8q7 5 15 1M-34 8q-7-1-10 2', .6, .29, 'wood')
    ) + flameOrSmoke + '</g>';
  }

  function chair(x, y, scale = 1) {
    return `<g transform="translate(${x} ${y}) rotate(-5) scale(${scale})">` + layers(
      fill('M-43-94 29-95 38-12-40-9Z', 'wood', .22) +
      fill('M-46-10 36-18 52 2-29 15Z', 'ochre', .42) +
      fill('M-29 15 52 2 51 11-28 24Z', 'wood', .42),
      scrawl([[-46,-104],[-40,-9],[-29,15],[-29,81]], 'chair-left', 2.8, .88) + scrawl([[31,-105],[38,-16],[52,2],[49,68]], 'chair-right', 1.5, .74) + pen('M-42-96q36-14 74-1M-39-73q37-9 69-2M-26-74l4 51m19-52 5 42M15-78q-2 28 7 45', 1.35,.71) +
      scrawl([[-46,-10],[36,-18],[52,2],[-29,15],[-46,-10]], 'chair-seat', 2.1, .8) + pen('M-37 24q-4 35-2 53m82-52 0 38M-42-7l-5 34M-29 54l47-4m10-1 16-1', 1.6,.77) + pen('M-45-80l-2 16m-2 0 5 28M-30 55l3 19',3.5,.67) +
      pen('M-36-4 34-11M-22 3l52-6M-38-91l8-3m2 11 19-2M-26 24l2 45', .65, .62, 'wood')
    ) + '</g>';
  }

  const ground = (key, dark = false) => layers(
    bloom(310, 405, 202, 14, dark ? 'indigo' : 'wood', dark ? .1 : .075, `${key}-floor`) +
    bloom(528, 373, 69, 17, 'pine', .07, `${key}-side`), '');

  function table(key, deep = false) {
    return layers(
      bloom(428, 374, 166, 33, 'wood', deep ? .2 : .1, `${key}-wet-grain`) +
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
      scrawl([[-90,-80],[46,-107],[103,-74],[-38,-42],[-90,-80]], 'lectern-top', 2.7, .82) + pen('M-89-74q29 21 49 37l60-12m37-8 40-13',1.5,.67) +
      scrawl([[-9,-45],[-12,20],[-17,70],[0,74],[17,66],[9,-49]], 'lectern-leg', 2.3,.8) + scrawl([[-52,79],[48,62],[72,72],[-42,94],[-65,88]], 'lectern-foot', 2,.73) +
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
      return room() + ground('meeting') + square() + layers(fill('M328 318Q294 303 269 290L244 271 232 281 218 271 225 293Q265 332 315 330Z', 'ink', .61), pen('M317 326q-47-9-76-26m-8-8-7-4', 2.3, .78)) + closedBook(335, 302, .46, -14) + candle(412, 297, .51);
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
          <feDisplacementMap in="SourceGraphic" in2="flow" scale="9" xChannelSelector="R" yChannelSelector="G" result="spread"/>
          <feTurbulence type="fractalNoise" baseFrequency=".48" numOctaves="3" seed="${seed + 3}" result="grain"/>
          <feColorMatrix in="grain" type="saturate" values="0"/>
          <feComponentTransfer result="granulation">
            <feFuncR type="table" tableValues=".82 1"/><feFuncG type="table" tableValues=".82 1"/><feFuncB type="table" tableValues=".82 1"/><feFuncA type="table" tableValues="1 1"/>
          </feComponentTransfer>
          <feComposite in="spread" in2="granulation" operator="arithmetic" k1="1" k2="0" k3="0" k4="0"/>
        </filter>
        <filter id="${id}-pen" x="-3%" y="-3%" width="106%" height="106%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".14" numOctaves="2" seed="8" result="tooth"/>
          <feDisplacementMap in="SourceGraphic" in2="tooth" scale="1.7" xChannelSelector="R" yChannelSelector="G"/>
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
