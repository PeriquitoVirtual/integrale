
(function () {
var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
// textos que o script escreve (% = número)
var TXT = { meta: 'Pergunta % de ', top: 'Em destaque', close: 'Fechar resposta', next: 'Próxima dúvida',
  one: '1 pergunta encontrada', many: '% perguntas encontradas', none: 'Nada por aqui. Fale com a gente logo abaixo.' };
// física: G = puxão ao centro, PUSH/PR = força/alcance do mouse, GAP = espaço entre bolhas
var G = 900, PUSH = 2400, PR = 78, GAP = 14, PAD = 8, P = 'upw-bub__';
function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function icon(d) { return '<svg class="' + P + 'ic" viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>'; }
function circ(r) { return 'circle(' + r.toFixed(1) + 'px at 50% 50%)'; }

function init(root) {
  if (root.dataset.upwOn) return;
  root.dataset.upwOn = '1';
  function q(c, el) { return (el || root).querySelector('.' + P + c); }
  var stage = q('stage'), list = q('list');
  if (!stage || !list) return;
  var uid = 'upw-bub-' + Math.random().toString(36).slice(2, 8), input = q('input'), clear = q('clear'), sw = q('sw'), status = q('status'), title = q('title');
  var B = [], W = 0, H = 0, baseH = 0, vert = false, aside = 1, cur = null, hover = null, box = null, pcx = 0, pcy = 0;
  var ptr = { x: 0, y: 0, on: false, f: 1 }, ghost = null, gn = 0, vis = !window.IntersectionObserver, entered = false;
  var raf = 0, last = 0, calm = 0, lastUser = 0, anim = null, topDone = false;

  root.classList.add('upw-js');
  if (title) { title.id = uid + '-t'; root.setAttribute('aria-labelledby', title.id); }
  list.id = uid + '-l';
  if (sw) sw.setAttribute('aria-controls', list.id);
  // painel da resposta (um por dobra) e anéis do fundo
  var panel = document.createElement('div');
  panel.className = P + 'panel';
  panel.id = uid + '-p';
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-labelledby', uid + '-q');
  panel.hidden = true;
  panel.innerHTML = '<div class="' + P + 'ptop"><span class="' + P + 'porb" aria-hidden="true">?</span><span class="' + P + 'pmeta"></span>' +
    '<button type="button" class="' + P + 'close" aria-label="' + TXT.close + '">' + icon('M6 6l12 12M18 6L6 18') + '</button></div>' +
    '<h3 class="' + P + 'pq" id="' + uid + '-q" tabindex="-1"></h3><div class="' + P + 'pa"></div><div class="' + P + 'pfoot">' +
    '<button type="button" class="' + P + 'next">' + TXT.next + icon('M5 12h14M13 6l6 6-6 6') + '</button></div>';
  var meta = q('pmeta', panel), pq = q('pq', panel), pa = q('pa', panel);
  stage.innerHTML = '<div class="' + P + 'rings" aria-hidden="true"></div>';

  // uma bolha (botão) para cada <li> da lista
  list.querySelectorAll('.' + P + 'item').forEach(function (li) {
    var hq = li.querySelector('h3'), a = li.querySelector('div');
    if (!hq) return;
    var i = B.length, peso = Math.max(1, Math.min(3, parseInt(li.getAttribute('data-peso'), 10) || 1)), top = peso === 3 && !topDone;
    var b = document.createElement('button'), tint = 'var(--upw-t' + (i % 5 + 1) + ')';
    topDone = topDone || top;
    b.type = 'button';
    b.className = P + 'bub';
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-controls', panel.id);
    b.style.cssText = '--upw-tint:' + tint + ';--upw-i:' + i + ';--upw-bd:' + (5.4 + i * 1.37 % 3).toFixed(2) + 's;--upw-bw:' + (-i * 1.9 % 6).toFixed(2) + 's';
    b.innerHTML = '<span class="' + P + 'float"><span class="' + P + 'orb"><span class="' + P + 'skin"></span>' + (top ? '<span class="' + P + 'tag">' + TXT.top + '</span>' : '') +
      '<span class="' + P + 'lbl"></span><span class="' + P + 'plus" aria-hidden="true">' + icon('M12 6v12M6 12h12') + '</span></span></span>';
    var lbl = q('lbl', b);
    lbl.textContent = li.getAttribute('data-curta') || hq.textContent.trim();
    li.style.cssText = '--upw-tint:' + tint + ';--upw-i:' + i + ';counter-set:upw-q ' + i; // número fixo na lista, mesmo com busca
    stage.appendChild(b);
    B.push({ el: b, li: li, q: hq, a: a, i: i, peso: peso, top: top, lbl: lbl, tag: q('tag', b), sk: q('skin', b), hay: norm(li.textContent + ' ' + (li.getAttribute('data-tags') || '')),
      vx: 0, vy: 0 });
  });
  stage.appendChild(panel);
  if (!B.length) return;

  // raio pelo data-peso; se o texto não couber, a bolha cresce
  function measure() {
    W = stage.clientWidth;
    if (!W) return false;
    vert = W < 860;
    var f = Math.min(1, Math.max(.8, .58 + W * .00036)), area = 0;
    B.forEach(function (o) { o.r0 = [72, 84, 98][o.peso - 1] * f; size(o); });
    B.forEach(function (o) {
      for (var k = 0; k < 6 && (o.lbl.offsetHeight + (o.tag ? o.tag.offsetHeight + 7 : 0) > o.r0 * 1.3 || o.lbl.scrollWidth > o.lbl.clientWidth + 1); k++) { o.r0 *= 1.07; size(o); }
      area += Math.PI * o.r0 * o.r0;
    });
    baseH = Math.round(vert ? Math.max(440, area / (W * .44)) : Math.max(Math.min(560, Math.max(400, innerHeight * .56)), area / (W * .42)));
    return true;
  }
  function size(o) {
    o.el.style.width = o.el.style.height = 2 * o.r0 + 'px';
    o.el.style.setProperty('--upw-d', 2 * o.r0 + 'px');
    o.r = o.rt = o.r0;
  }
  // espiral inicial (maiores no meio), já acomodada
  function seed() {
    var avg = 0, order = B.slice().sort(function (a, b) { return b.r0 - a.r0 || a.i - b.i; });
    B.forEach(function (o) { avg += o.r0 / B.length; });
    H = baseH;
    order.forEach(function (o, k) {
      var ang = k * 2.39996 + .5, rad = Math.sqrt(k) * avg * 1.15;
      o.x = W / 2 + Math.cos(ang) * rad * (vert ? .55 : 1.7);
      o.y = H / 2 + Math.sin(ang) * rad * (vert ? 1.45 : .6);
    });
    for (var n = 0; n < 420; n++) step(1 / 60);
    B.forEach(function (o) { o.vx = o.vy = 0; });
  }
  function retarget() {
    B.forEach(function (o) { o.rt = o.r0 * (cur ? (o === cur ? .3 : aside) : 1) * (o.miss ? .84 : o.hit ? 1.06 : 1); });
  }

  // física: centro + mouse + bolhas se afastando + painel + paredes
  function step(dt) {
    var n = B.length, cx = W / 2, cy = H / 2, gx = G / cx, gy = G / cy, damp = Math.pow(.92, dt * 60), sp = 0, i, j, o, p, dx, dy, d, m, k, ax, ay, c, w;
    for (i = 0; i < n; i++) {
      o = B[i];
      o.r += (o.rt - o.r) * .16;
      if (Math.abs(o.rt - o.r) > .3) sp = 9;
      o.ox = o.x; o.oy = o.y;
      if (o.park) { o.x += (pcx - o.x) * .3; o.y += (pcy - o.y) * .3; continue; }
      ax = ay = 0;
      if (o !== hover) {
        ax = (cx - o.x) * gx; ay = (cy - o.y) * gy;
        dx = o.x - ptr.x; dy = o.y - ptr.y; m = o.r + PR; d = dx * dx + dy * dy;
        if (ptr.on && d < m * m && d > .01) { d = Math.sqrt(d); k = (1 - d / m) * PUSH * ptr.f / d; ax += dx * k; ay += dy * k; }
      }
      k = o === hover ? .6 : damp;
      o.vx = (o.vx + ax * dt) * k; o.vy = (o.vy + ay * dt) * k;
      o.x += o.vx * dt; o.y += o.vy * dt;
    }
    for (k = 0; k < 2; k++) for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
      o = B[i]; p = B[j];
      if (o.park || p.park) continue;
      dx = p.x - o.x; dy = p.y - o.y; m = o.r + p.r + GAP * Math.min(o.r, p.r) / Math.max(o.r0, p.r0); d = dx * dx + dy * dy;
      if (d >= m * m) continue;
      d = Math.sqrt(d) || .01; c = (m - d) / d * .5; w = o === hover ? 0 : p === hover ? 1 : .5;
      o.x -= dx * c * w; o.y -= dy * c * w; p.x += dx * c * (1 - w); p.y += dy * c * (1 - w);
    }
    for (i = 0; i < n; i++) {
      o = B[i];
      if (o.park) continue;
      if (box) { // painel aberto empurra as bolhas para os lados (celular: cima/baixo)
        // vai para o lado do painel que tem espaço para ela
        if (vert) { if (o.y + o.r > box.t && o.y - o.r < box.b) o.y += ((box.t > 2 * o.r + PAD && (o.y < pcy || H - box.b < 2 * o.r + PAD) ? box.t - o.r : box.b + o.r) - o.y) * .3; }
        else if (o.x + o.r > box.l && o.x - o.r < box.r) o.x += ((o.x < pcx ? box.l - o.r : box.r + o.r) - o.x) * .3;
      }
      m = o.r + PAD;
      o.x = W < 2 * m ? W / 2 : Math.max(m, Math.min(W - m, o.x));
      o.y = H < 2 * m ? H / 2 : Math.max(m, Math.min(H - m, o.y));
      o.vx = (o.x - o.ox) / dt; o.vy = (o.y - o.oy) / dt;
      d = Math.sqrt(o.vx * o.vx + o.vy * o.vy);
      if (d > sp) sp = d;
    }
    return sp;
  }
  // desenha: posição + tamanho; a pele de vidro estica no sentido do movimento ("gelatina")
  function paint() {
    B.forEach(function (o) {
      var v = Math.sqrt(o.vx * o.vx + o.vy * o.vy), g = reduce ? 0 : Math.min(.08, v / 3200), a, j = '';
      var tr = 'translate3d(' + (o.x - o.r0).toFixed(1) + 'px,' + (o.y - o.r0).toFixed(1) + 'px,0) scale(' + (o.r / o.r0).toFixed(3) + ')';
      if (g > .004) { a = (Math.atan2(o.vy, o.vx) * 57.3).toFixed(1); j = 'rotate(' + a + 'deg) scale(' + (1 + g).toFixed(3) + ',' + (1 - g).toFixed(3) + ') rotate(' + -a + 'deg)'; }
      if (tr !== o.tr) o.el.style.transform = o.tr = tr;
      if (j !== o.j) o.sk.style.transform = o.j = j;
    });
  }
  function tick(t) {
    raf = 0;
    if (!vis || document.hidden) { last = 0; return; }
    var real = last ? Math.min(.05, (t - last) / 1000) : 1 / 60, n = Math.max(1, Math.min(3, Math.round(real * 60))), sp = 0, u, e;
    last = t;
    if (ghost) { // brisa: um "dedo invisível" atravessa o palco
      if (!ghost.t0) ghost.t0 = t;
      u = (t - ghost.t0) / 3400; e = .5 - Math.cos(Math.min(1, u) * Math.PI) / 2;
      if (u >= 1) { ghost = null; ptr.on = false; }
      else {
        ptr.on = true; ptr.f = .55;
        ptr.x = vert ? ghost.c + Math.sin(u * 6.3) * 30 : ghost.a + (ghost.b - ghost.a) * e;
        ptr.y = vert ? ghost.a + (ghost.b - ghost.a) * e : ghost.c + Math.sin(u * 6.3) * 30;
      }
    }
    while (n--) sp = Math.max(sp, step(1 / 60));
    paint();
    calm = sp < 5 && !ghost ? calm + 1 : 0;
    if (calm < 30) raf = requestAnimationFrame(tick); else last = 0;
  }
  function wake() {
    calm = 0;
    if (!W) return;
    if (reduce) { for (var k = 0; k < 400; k++) step(1 / 60); B.forEach(function (o) { o.r = o.rt; o.vx = o.vy = 0; }); paint(); return; }
    if (!raf && vis && !document.hidden && !root.classList.contains('is-list')) raf = requestAnimationFrame(tick);
  }

  // painel no meio (celular: na altura da bolha tocada); as outras encolhem
  function place() {
    var rest = 0, pw, ph, pl, pt;
    B.forEach(function (o) { if (o !== cur) rest += Math.PI * o.r0 * o.r0; });
    panel.style.width = (vert ? Math.min(W, 620) : Math.min(560, W * .5)) + 'px';
    pw = panel.offsetWidth; ph = panel.offsetHeight; pl = (W - pw) / 2;
    if (vert) {
      aside = .74;
      H = Math.round(Math.max(baseH, ph + 40 + rest * aside * aside / (W * .42)));
      pt = Math.max(8, Math.min(H - ph - 8, cur.y - ph / 2));
      box = { t: pt - 10, b: pt + ph + 10 };
    } else {
      H = Math.max(baseH, ph + 40);
      aside = Math.max(.5, Math.min(.82, Math.sqrt((W - pw - 40) * H * .42 / rest)));
      pt = (H - ph) / 2;
      box = { l: pl - 14, r: pl + pw + 14 };
    }
    panel.style.left = pl + 'px'; panel.style.top = pt + 'px';
    pcx = pl + pw / 2; pcy = pt + ph / 2;
    stage.style.height = H + 'px';
    retarget();
  }
  function open(o, focus) {
    if (!o || o === cur) return;
    var prev = cur, R;
    if (anim) { anim.cancel(); anim = null; }
    cur = o;
    panel.style.setProperty('--upw-tint', o.el.style.getPropertyValue('--upw-tint'));
    meta.textContent = TXT.meta.replace('%', o.i + 1) + B.length + (o.top ? ' · ' + TXT.top : '');
    pq.textContent = o.q.textContent.trim();
    pa.innerHTML = o.a ? o.a.innerHTML : '';
    panel.hidden = false;
    panel.classList.remove('is-shown');
    B.forEach(function (b) { b.el.setAttribute('aria-expanded', b === o ? 'true' : 'false'); });
    o.el.classList.add('is-docked');
    if (prev) { prev.park = false; prev.el.classList.remove('is-docked'); prev.x = pcx; prev.y = pcy; prev.r = prev.r0 * .3; }
    place();
    o.park = true;
    if (!prev && !reduce && panel.animate) {
      // a bolha cresce e "encaixa": o painel sai dela e abre em círculo
      R = Math.sqrt(panel.offsetWidth * panel.offsetWidth + panel.offsetHeight * panel.offsetHeight) / 2 + 2;
      anim = panel.animate([{ transform: 'translate(' + (o.x - pcx).toFixed(1) + 'px,' + (o.y - pcy).toFixed(1) + 'px)', clipPath: circ(o.r) },
        { transform: 'translate(0px,0px)', clipPath: circ(R) }], { duration: 720, easing: 'cubic-bezier(.2,.85,.25,1)' });
      anim.onfinish = function () { anim = null; };
      setTimeout(function () { if (cur === o) panel.classList.add('is-shown'); }, 200);
    } else {
      void panel.offsetWidth;
      panel.classList.add('is-shown');
    }
    if (focus) pq.focus({ preventScroll: true });
    wake();
  }
  function close(focusBack) {
    if (!cur) return;
    var o = cur, R = Math.sqrt(panel.offsetWidth * panel.offsetWidth + panel.offsetHeight * panel.offsetHeight) / 2 + 2;
    cur = box = null;
    o.park = false; o.x = pcx; o.y = pcy; o.r = o.r0 * .35;
    o.el.classList.remove('is-docked');
    B.forEach(function (b) { b.el.setAttribute('aria-expanded', 'false'); });
    panel.classList.remove('is-shown');
    H = baseH; stage.style.height = H + 'px';
    retarget();
    if (anim) anim.cancel();
    if (!reduce && panel.animate) {
      anim = panel.animate([{ clipPath: circ(R), opacity: 1 }, { clipPath: circ(o.r0 * .6), opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.5,0,.75,0)' });
      anim.onfinish = function () { anim = null; if (!cur) panel.hidden = true; };
    } else panel.hidden = true;
    if (focusBack) o.el.focus({ preventScroll: true });
    wake();
  }
  function find(t) { for (var i = 0; i < B.length; i++) if (B[i].el.contains(t)) return B[i]; return null; }
  function nextOf(o, d) {
    for (var s = 1, j; s <= B.length; s++) { j = B[(o.i + d * s + B.length * 2) % B.length]; if (!j.miss && j !== cur) return j; }
    return null;
  }

  // busca: acende as bolhas (e filtra a lista) com todas as palavras
  function filter() {
    var words = norm(input.value).split(/\s+/).filter(Boolean), n = 0;
    if (clear) clear.hidden = !input.value;
    B.forEach(function (o) {
      o.hit = words.length > 0 && words.every(function (w) { return o.hay.indexOf(w) > -1; });
      o.miss = words.length > 0 && !o.hit;
      if (o.hit) n++;
      o.el.classList.toggle('is-hit', o.hit);
      o.el.classList.toggle('is-miss', o.miss);
      o.li.hidden = o.miss;
    });
    if (status) status.textContent = !words.length ? '' : n === 1 ? TXT.one : n ? TXT.many.replace('%', n) : TXT.none;
    retarget(); wake();
  }
  function setList(on) {
    if (on && cur) close(false);
    root.classList.toggle('is-list', on);
    if (!on) { if (stage.clientWidth !== W) relayout(); wake(); }
  }

  B.forEach(function (o) { o.el.addEventListener('click', function () { lastUser = Date.now(); open(o, true); }); });
  q('close', panel).addEventListener('click', function () { close(true); });
  q('next', panel).addEventListener('click', function () { if (cur) open(nextOf(cur, 1), true); });
  if (input) {
    input.addEventListener('input', filter);
    input.addEventListener('keydown', function (e) { // Enter abre a primeira bolha que combina
      if (e.key !== 'Enter') return;
      e.preventDefault();
      for (var i = 0; i < B.length; i++) if (B[i].hit) { if (sw && sw.checked) { sw.checked = false; setList(false); } open(B[i], true); break; }
    });
  }
  if (clear) clear.addEventListener('click', function () { input.value = ''; filter(); input.focus(); });
  if (sw) sw.addEventListener('change', function () { setList(sw.checked); });
  stage.addEventListener('pointermove', function (e) {
    if (reduce) return;
    var r = stage.getBoundingClientRect();
    ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.on = true; ptr.f = 1; ghost = null; lastUser = Date.now();
    wake();
  }, { passive: true });
  stage.addEventListener('pointerover', function (e) { var o = find(e.target); hover = o && e.pointerType !== 'touch' ? o : null; }, { passive: true });
  stage.addEventListener('pointerleave', function () { ptr.on = false; hover = null; wake(); }, { passive: true });
  // toque no vazio: as bolhas se afastam (e um clique/toque no vazio fecha a resposta)
  stage.addEventListener('pointerdown', function (e) {
    lastUser = Date.now();
    if (find(e.target) || panel.contains(e.target)) return;
    var r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (!reduce) B.forEach(function (o) {
      var dx = o.x - x, dy = o.y - y, d = Math.sqrt(dx * dx + dy * dy) || 1, k = Math.max(0, 1 - d / 280) * 520;
      o.vx += dx / d * k; o.vy += dy / d * k;
    });
    wake();
  }, { passive: true });
  stage.addEventListener('click', function (e) { if (cur && !find(e.target) && !panel.contains(e.target)) close(false); });
  // setas andam entre as bolhas; Esc fecha a resposta
  stage.addEventListener('keydown', function (e) {
    var o = find(e.target), d = /^Arrow(Right|Down)$/.test(e.key) ? 1 : /^Arrow(Left|Up)$/.test(e.key) ? -1 : 0, n;
    if (!o || !d) return;
    e.preventDefault();
    n = nextOf(o, d);
    if (n) n.el.focus();
  });
  root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && cur) close(true); });

  function relayout() {
    var oW = W, oH = H;
    if (!measure()) return;
    if (!oW || !entered && !cur) seed();
    else { B.forEach(function (o) { o.x *= W / oW; o.y *= baseH / oH; }); H = baseH; }
    if (cur) place(); else retarget();
    stage.style.height = H + 'px';
    paint(); wake();
  }
  function enter() {
    entered = true;
    // começam juntinhas e se espalham enquanto inflam
    if (!reduce) B.forEach(function (o) { o.x = W / 2 + (o.x - W / 2) * .8; o.y = H / 2 + (o.y - H / 2) * .8; });
    root.classList.add('is-in');
    paint(); wake();
  }
  relayout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout); // fonte nova muda o tamanho do texto
  if (window.ResizeObserver) new ResizeObserver(function () { if (stage.clientWidth && stage.clientWidth !== W) relayout(); }).observe(stage);
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (es) { vis = es[es.length - 1].isIntersecting; root.classList.toggle('is-off', !vis); if (vis) wake(); }).observe(stage);
    var io = new IntersectionObserver(function (es) { if (es[es.length - 1].isIntersecting && !entered) { enter(); io.disconnect(); } }, { threshold: .12 });
    io.observe(root);
  } else enter();
  document.addEventListener('visibilitychange', function () { if (!document.hidden) wake(); });
  // parada há um tempo? uma brisa mexe as bolhas
  setInterval(function () {
    if (reduce || !vis || !entered || cur || ghost || root.classList.contains('is-list') || stage.contains(document.activeElement) || Date.now() - lastUser < 6000) return;
    var g = gn++ % 2, len = vert ? H : W;
    ghost = { t0: 0, a: g ? len + 60 : -60, b: g ? -60 : len + 60, c: (vert ? W : H) * (.32 + gn * .37 % .36) };
    wake();
  }, 8000);
}
document.querySelectorAll('.upw-sec-bubbles').forEach(init);
})();
