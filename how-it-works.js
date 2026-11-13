
(function () {
  function mq(q) { return window.matchMedia ? matchMedia(q) : { matches: false }; }
  var still = mq('(prefers-reduced-motion: reduce)').matches, wide = mq('(min-width: 960px)');

  document.querySelectorAll('.upw-sec-days').forEach(function (root) {
    if (root.dataset.upwOn) return; root.dataset.upwOn = '1';
    var lis = [].slice.call(root.querySelectorAll('.upw-days__day')), N = lis.length;
    if (!N || !window.IntersectionObserver) return; // sem suporte: tudo fica pronto e visível
    function $(c) { return root.querySelector('.upw-days__' + c); }
    var key = 'upw-days-' + Math.random().toString(36).slice(2, 8), STEP = +root.getAttribute('data-step') || 330;
    var track = $('track'), stamp = $('stamp'), meter = $('meter'), say = $('say'), tryBtn = $('try'), gauge = $('gauge');
    var cards = [], T = [], seen = [], ang = [], vel = [], waiting = -1, started = 0, stampSeen = 0, waitStamp = 0, inView = 0;
    var openI = -1, pinned = 0, idleN = 0, idleT = 0, idleWant = 0, msg = 0, raf = 0, last = 0;
    function later(f, ms) { T.push(setTimeout(f, ms)); }

    // peças decorativas: bolinha, trecho do trilho, número e "+" de cada dia
    lis.forEach(function (li, i) {
      cards[i] = li.querySelector('.upw-days__card'); ang[i] = vel[i] = 0;
      li.style.setProperty('--upw-i', i);
      li.insertAdjacentHTML('afterbegin', '<span class="upw-days__node" aria-hidden="true"></span>' + (i < N - 1 ? '<span class="upw-days__seg" aria-hidden="true"><i></i></span>' : ''));
      cards[i].insertAdjacentHTML('beforeend', '<span class="upw-days__num" aria-hidden="true">' + (i < 9 ? '0' : '') + (i + 1) + '</span>');
    });
    root.querySelectorAll('.upw-days__ico svg *').forEach(function (el) { el.setAttribute('pathLength', 1); });
    root.classList.add('upw-days-on');
    root.style.setProperty('--upw-step', STEP + 'ms');
    if (still) setTimeout(start); // movimento reduzido: tudo pronto, sem animar

    // ---- fichas penduradas: cada empurrão vira um balanço que para sozinho (mola) ----
    function wake() { if (!raf && inView && !document.hidden && (ang.some(Boolean) || vel.some(Boolean))) { last = 0; raf = requestAnimationFrame(swing); } }
    function kick(i, v) { if (!still && wide.matches && cards[i]) { vel[i] += v; wake(); } }
    function swing(now) {
      var dt = last ? Math.min((now - last) / 1000, .04) : .016, moving = 0, i, a, v;
      last = now;
      for (i = 0; i < N; i++) {
        a = ang[i]; v = vel[i];
        if (!a && !v) continue;
        v += (-95 * a - 3.6 * v) * dt; a = Math.max(-14, Math.min(14, a + v * dt));
        if (Math.abs(a) < .03 && Math.abs(v) < .3) a = v = 0; else moving = 1;
        ang[i] = a; vel[i] = v; cards[i].style.rotate = a ? a.toFixed(2) + 'deg' : '';
      }
      raf = moving && inView && !document.hidden ? requestAnimationFrame(swing) : 0;
    }
    // o mouse passando "esbarra" nas fichas
    var px = null, pt = 0, over = -1;
    track.addEventListener('pointermove', function (e) {
      if (e.pointerType == 'touch') return;
      var i = lis.indexOf(e.target.closest && e.target.closest('.upw-days__day')), vx = px == null ? 0 : (e.clientX - px) / Math.max(8, e.timeStamp - pt);
      px = e.clientX; pt = e.timeStamp;
      if (i != over) { if (i >= 0) kick(i, Math.max(-75, Math.min(75, -vx * 45))); over = i; }
    }, { passive: true });
    track.addEventListener('pointerleave', function () { over = -1; px = null; }, { passive: true });

    // ---- medidor: o ponteiro tenta subir e volta para o zero ----
    function tryNeedle(r) {
      if (still || !meter) return;
      meter.style.setProperty('--upw-reach', r + 'deg');
      meter.classList.remove('is-try'); void meter.offsetWidth; meter.classList.add('is-try');
    }
    if (meter) meter.addEventListener('animationend', function (e) { if (e.animationName == 'upw-days-try') meter.classList.remove('is-try'); });
    if (gauge) gauge.addEventListener('pointerenter', function (e) { if (e.pointerType == 'mouse' && !meter.classList.contains('is-try')) tryNeedle(44); });
    if (tryBtn) tryBtn.addEventListener('click', function () {
      var f = (tryBtn.getAttribute('data-frases') || '').split('|');
      tryNeedle(118 + Math.random() * 30);
      if (say && f[0]) setTimeout(function () { say.textContent = f[msg++ % f.length]; }, still ? 0 : 750); // troca a frase quando o ponteiro volta
    });
    function idle(ms) { // depois do carimbo o ponteiro ainda tenta mais 3 vezes (só com a dobra na tela)
      clearTimeout(idleT);
      if (still || idleN >= 3) return;
      idleT = setTimeout(function () {
        if (!inView || document.hidden) { idleWant = 1; return; }
        idleN++; tryNeedle(22 + idleN * 10); idle(5200);
      }, ms);
    }

    // ---- sequência: a linha enche dia a dia e no fim o carimbo cai ----
    function light(i) {
      lis[i].classList.add('is-lit');
      kick(i, i % 2 ? -24 : 24);
      if (i == Math.floor((N - 1) / 2)) tryNeedle(34);
      if (i < N - 1) { lis[i].classList.add('is-flow'); later(function () { next(i + 1); }, STEP); } else later(finish, 360);
    }
    function next(i) { if (seen[i] && inView) light(i); else waiting = i; } // espera o dia aparecer na tela (e pausa fora dela)
    function resume() { var w = waiting; if (w >= 0 && seen[w] && inView) { waiting = -1; later(function () { light(w); }, 160); } }
    function finish() {}
    function land() {
      waitStamp = 0;
      root.classList.add('is-stamped');
      later(function () { root.classList.add('is-inked'); }, 530); // a tinta "seca" quando o carimbo para
      later(function () {
        var c = (N - 1) / 2, i, d;
        root.classList.add('is-impact');
        tryNeedle(70);
        for (i = 0; i < N; i++) { d = i - c; kick(i, Math.abs(d) < .6 ? 20 : (d < 0 ? 1 : -1) * Math.max(24, 80 - Math.abs(d) * 14)); }
        idle(3800);
      }, 350);
    }
    function done() { lis.forEach(function (li) { li.classList.add('is-seen', 'is-lit', 'is-flow'); }); root.classList.add('is-in', 'is-stamped', 'is-impact', 'is-inked'); }
    function start() { if (!started) { started = 1; if (still) done(); else later(function () { next(0); }, 560); } }
    function rerun() {
      T.forEach(clearTimeout); T = []; waiting = -1; waitStamp = idleN = 0; clearTimeout(idleT);

      root.classList.remove('is-stamped', 'is-impact', 'is-inked');
      lis.forEach(function (li) { li.classList.remove('is-lit', 'is-flow'); });
      if (still) return done();
      root.classList.add('is-rewind');
      later(function () { root.classList.remove('is-rewind'); next(0); }, 520);
    }
    var rp = $('replay'); if (rp) rp.addEventListener('click', rerun);

    // ---- só anima com a dobra na tela ----
    var io = new IntersectionObserver(function (list) {
      list.forEach(function (en) {
        var t = en.target, i;
        if (t == root) {
          inView = en.isIntersecting;
          if (inView) { root.classList.add('is-in'); wake(); resume(); if (idleWant) { idleWant = 0; idle(1500); } }
          else if (raf) { cancelAnimationFrame(raf); raf = 0; }
        } else if (t == stamp) {
          if (en.intersectionRatio > .4) { stampSeen = 1; if (waitStamp) land(); }
        } else if (en.isIntersecting && !seen[i = lis.indexOf(t)]) {
          seen[i] = 1; t.classList.add('is-seen'); start(); resume();
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: [0, .45] });
    io.observe(root); if(stamp) io.observe(stamp); lis.forEach(function (li) { io.observe(li); });
    document.addEventListener('visibilitychange', wake);

    // gancho só para a prévia em vídeo: abre os detalhes de um dia como se o mouse passasse
  });
})();