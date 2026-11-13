
(function () {
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, n = 0, PI2 = Math.PI * 2, R = Math.random;
  document.querySelectorAll('.upw-btn-ink').forEach(function (btn) {
    if (btn.dataset.upwOn) return; btn.dataset.upwOn = '1';
    var GROW = +btn.getAttribute('data-upw-tempo') || 900, DROPS = btn.getAttribute('data-upw-gotas');
    DROPS = DROPS === null ? 7 : +DROPS;

    // respingo: a gota voa esticada e pousa no papel
    function drop(x, y, a, s, dist) {
      var d = document.createElement('span'), r = 'rotate(' + a + 'deg) translateX(', go = r + dist + 'px) scale(', br = '';
      for (var i = 0; i < 4; i++) br += (38 + R() * 24 | 0) + '% ';
      d.className = 'upw-btn-ink__drop';
      d.style.cssText = 'left:' + (x - s / 2) + 'px;top:' + (y - s / 2) + 'px;width:' + s + 'px;height:' + s + 'px;border-radius:' + br;
      btn.appendChild(d);
      d.animate([
        { transform: r + '0) scale(.3)', opacity: 1, easing: 'cubic-bezier(.15,.85,.35,1)' },
        { transform: go + '1.8,.6)', opacity: 1, offset: .13 },
        { transform: go + '1.15)', opacity: 1, offset: .22 },
        { transform: go + '1.15)', opacity: 1, offset: .55 },
        { transform: go + '1.2)', opacity: 0 }
      ], 1400).onfinish = function () { d.remove(); };
    }
    function on(ev, f) { btn.addEventListener(ev, f); }
    on('click', function () {
      btn.classList.add('upw-btn-ink--press');
      setTimeout(function () { btn.classList.remove('upw-btn-ink--press'); }, 160);
      if (still || !btn.animate) return;
      var W = btn.clientWidth, H = btn.clientHeight;
      for (var i = 0; i < DROPS; i++) { // de um ponto da borda, para fora
        var u = R() * (W + H) * 2, x, y, a, s = 2.5 + R() * 4.5, dist = 9 + R() * 18;
        if (u < 2 * W) { x = u % W; y = u < W ? 0 : H; a = u < W ? -90 : 90; }
        else { u -= 2 * W; x = u < H ? 0 : W; y = u % H; a = u < H ? 180 : 0; }
        a += R() * 70 - 35;
        drop(x, y, a, s, dist);
        if (R() < .75) drop(x, y, a + R() * 8 - 4, s * .45, dist * 1.5 + 5); // gotinha que vai mais longe
      }
    });
    if (still) return;

    // tinta: polígono orgânico no SVG (filtro com id único) + cópia creme do conteúdo recortada no mesmo formato
    var id = 'upw-ink-' + (++n) + R().toString(36).slice(2, 8), layer = document.createElement('span'), over = document.createElement('span');
    over.className = 'upw-btn-ink__over'; over.innerHTML = btn.innerHTML;
    layer.className = 'upw-btn-ink__layer';
    layer.innerHTML = '<svg width="100%" height="100%"><filter id="' + id + '" filterUnits="userSpaceOnUse" x="-20%" y="-60%" width="140%" height="220%" color-interpolation-filters="sRGB">' +
      '<feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation=".5" result="d"/>' +
      '<feGaussianBlur stdDeviation="3"/><feDisplacementMap in2="n" scale="20" xChannelSelector="G" yChannelSelector="R"/>' +
      '<feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .5 0"/><feMerge><feMergeNode/><feMergeNode in="d"/></feMerge></filter>' +
      '<polygon class="upw-btn-ink__blot" filter="url(#' + id + ')"/></svg>';
    over.setAttribute('aria-hidden', 'true'); layer.setAttribute('aria-hidden', 'true');
    btn.insertBefore(layer, btn.firstChild); btn.appendChild(over); btn.classList.add('upw-btn-ink--js');
    var blot = layer.getElementsByTagName('polygon')[0], noise = layer.getElementsByTagName('feTurbulence')[0],
      t = 0, from = 0, to = 0, t0 = 0, dur = 1, raf = 0, x = 0, y = 0, w = 0, h = 0, hover = 0, focus = 0, timer, tap, waves, AMP = 9;

    function at(e) { // ponto do evento no botão (sem evento = centro)
      var a = layer.getBoundingClientRect(), k;
      w = layer.offsetWidth; h = layer.offsetHeight; k = w / (a.width || 1);
      return e && e.clientX != null ? [(e.clientX - a.left) * k, (e.clientY - a.top) * k] : [w / 2, h / 2];
    }
    function cover() { var dx = Math.max(x, w - x), dy = Math.max(y, h - y); return Math.sqrt(dx * dx + dy * dy) + AMP * 2.4; } // já cobre o canto mais longe
    function full() { return cover() * 1.12 + 8; }
    function draw() {
      var r = full() * t, m = Math.max(16, Math.min(260, r * .8 | 0)), amp = Math.min(r * .3, AMP), pts = '', poly = '', i, j, a, q, px, py;
      for (i = 0; i < m; i++) { // borda ondulada por ondas fixas no papel
        a = i / m * PI2; px = x + Math.cos(a) * r; py = y + Math.sin(a) * r; q = 0;
        for (j = 0; j < 4; j++) q += waves[j][3] * Math.sin(waves[j][0] * px + waves[j][1] * py + waves[j][2]);
        q = r + q * amp; px = (x + Math.cos(a) * q).toFixed(1); py = (y + Math.sin(a) * q).toFixed(1);
        pts += px + ',' + py + ' '; poly += (i ? ',' : '') + px + 'px ' + py + 'px';
      }
      blot.setAttribute('points', r > 1 ? pts : '');
      over.style.webkitClipPath = over.style.clipPath = r > 1 ? 'polygon(' + poly + ')' : '';
    }
    function tick(now) {
      var p = Math.max(0, Math.min(1, (now - t0) / dur));
      t = from + (to - from) * (to > from ? 1 - Math.pow(1 - p, 2.2) : p * p * (3 - 2 * p));
      draw();
      raf = p < 1 ? requestAnimationFrame(tick) : 0;
    }
    function run(target, ms) {
      from = t; to = target; t0 = performance.now(); dur = ms * (.4 + .6 * Math.abs(target - t));
      if (!raf) raf = requestAnimationFrame(tick);
    }
    function fill(p, ms) { // nasce no ponto p, com desenho novo a cada vez
      clearTimeout(timer);
      if (t < .01) {
        x = p[0]; y = p[1]; waves = [];
        for (var j = 0; j < 4; j++) { var d = R() * PI2, k = PI2 / [90, 52, 30, 18][j]; waves.push([Math.cos(d) * k, Math.sin(d) * k, R() * PI2, [1, .7, .45, .25][j]]); }
        noise.setAttribute('seed', R() * 999 | 0);
      }
      run(1, ms || GROW);
    }
    function drain(p) { // escorre para o ponto de saída
      if (!t) return;
      if (full() * t >= cover()) { x = p[0]; y = p[1]; t = cover() / full(); }
      run(0, GROW * .7);
    }
    on('pointerenter', function (e) { if (e.pointerType !== 'touch') { hover = 1; fill(at(e)); } });
    on('pointerleave', function (e) { if (e.pointerType !== 'touch') { hover = 0; if (!focus) drain(at(e)); } });
    // toque: espalha do dedo e escorre (sem travar a rolagem)
    on('pointerdown', function (e) { if (e.pointerType === 'touch') fill(tap = at(e), GROW * .5); });
    on('pointerup', function (e) { if (e.pointerType === 'touch') timer = setTimeout(function () { drain(tap); }, 700); });
    on('pointercancel', function () { if (!hover && !focus) drain(tap || at()); });
    // teclado: espalha do centro
    on('focus', function () {
      var v = 1; try { v = btn.matches(':focus-visible'); } catch (err) {}
      if (v) { focus = 1; if (!hover) fill(at()); }
    });
    on('blur', function () { if (focus) { focus = 0; if (!hover) drain(at()); } });
    window.addEventListener('resize', function () { if (t) { at(); draw(); } }); // continua cobrindo se o botão mudar de tamanho
  });
})();
