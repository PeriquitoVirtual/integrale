
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  // voo em px a partir do avião (curvas cúbicas): decola, faz um looping e some no alto; BACK volta planando
  var OUT = [0,0,36,0,72,-12,95,-34,113,-52,126,-82,111,-95,97,-108,71,-98,78,-77,84,-59,118,-60,148,-79,178,-98,204,-114,226,-125];
  var BACK = [-122,-58,-72,-58,-42,0,0,0];
  function r(n) { return Math.round(n * 10) / 10; }
  function path(P, kx) { // pontos ao longo das curvas: [x, y, distância]
    var o = [], d = 0;
    for (var s = 0; s + 7 < P.length; s += 6) for (var i = s ? 1 : 0; i <= 30; i++) {
      var t = i / 30, u = 1 - t, w = [u*u*u, 3*u*u*t, 3*u*t*t, t*t*t], x = 0, y = 0, q = o[o.length - 1];
      for (var k = 0; k < 4; k++) { x += w[k] * P[s+2*k] * kx; y += w[k] * P[s+2*k+1]; }
      if (q) d += Math.hypot(x - q[0], y - q[1]);
      o.push([x, y, d]);
    }
    return o;
  }
  function at(o, f) { // ponto na fração f do caminho + ângulo da direção
    var L = o[o.length - 1][2] * f, i = 1;
    while (i < o.length - 1 && o[i][2] < L) i++;
    var p = o[i - 1], q = o[i], k = (L - p[2]) / (q[2] - p[2] || 1);
    return [r(p[0] + (q[0]-p[0]) * k), r(p[1] + (q[1]-p[1]) * k), Math.atan2(q[1]-p[1], q[0]-p[0]) * 57.3];
  }
  // o avião segue o caminho girando na direção do voo (Web Animations) e deixa um rastro tracejado que some
  function fly(jet, trail, o, dur, ease, scale, alpha) {
    var fr = [], last = 0, end = o[o.length - 1][2], tail = dur + 650;
    for (var i = 0; i <= 120; i++) {
      var t = i / 120, p = at(o, ease(t)), a = p[2];
      while (i && a - last > 180) a -= 360;
      while (i && a - last < -180) a += 360;
      last = a;
      fr.push({ transform: 'translate(' + p[0] + 'px,' + p[1] + 'px) rotate(' + r(a) + 'deg) scale(' + r(scale(t) * 100) / 100 + ')', opacity: alpha(t) });
    }
    trail.replaceChildren();
    var d=document.createElementNS(NS,'path');
    d.setAttribute('d',o.map(function(p,i){return (i?'L':'M')+p[0]+' '+p[1];}).join(' '));
    d.setAttribute('stroke-dasharray','5 7');
    trail.appendChild(d);
    d.animate([{opacity:0},{opacity:.5,offset:.25},{opacity:0}],{duration:tail,easing:'ease-out'}).onfinish=function(){d.remove();};
    return jet.animate(fr, { duration: dur, fill: 'forwards' });
  }
  document.querySelectorAll('.upw-btn-plane').forEach(function (btn) {
    if (btn.dataset.upwOn) return;
    btn.dataset.upwOn = '1';
    var jet = btn.querySelector('.upw-btn-plane__jet'), sr = btn.querySelector('.upw-btn-plane__sr'), cl = btn.classList, busy = false, anim;
    var trail = btn.insertBefore(document.createElementNS(NS, 'svg'), btn.firstChild);
    trail.setAttribute('class', 'upw-btn-plane__trail');
    function send() {
      if (busy) return;
      busy = true;
      var still = matchMedia('(prefers-reduced-motion: reduce)').matches || !jet.animate;
      cl.add('is-sending', 'is-away', still ? 'is-still' : 'is-flying');
      setTimeout(function () { cl.add('is-sent'); sr.textContent = 'Abra o WhatsApp para conversar com a equipe'; }, still ? 150 : 380);
      if (!still) anim = fly(jet, trail, path(OUT, Math.min(1, Math.max(.75, (btn.offsetWidth - 12) / 258))), 1150,
        function (t) { return .25*t + .75 * (t < .25 ? 2.857*t*t : t < .65 ? 1.4286 * (t - .125) : 1 - 2.041 * (1-t) * (1-t)); },
        function (t) { return t < .45 ? 1 + t*.667 : 1.3 - .85 * Math.pow((t - .45) / .55, 1.2); },
        function (t) { return t < .8 ? 1 : 5 - 5 * t; });
      setTimeout(function () { // a volta
        cl.remove('is-sent', 'is-flying');
        if (!still) {
          anim.cancel();
          anim = fly(jet, trail, path(BACK, 1), 900,
            function (t) { return 1 - Math.pow(1 - t, 2.2); },
            function (t) { return 1 - .4 * (1-t) * (1-t); },
            function (t) { return Math.min(1, t / .3); });
          anim.onfinish = function () { // pouso
            anim.cancel(); cl.remove('is-away');
            jet.animate({ transform: ['none', 'translateY(1.5px) rotate(5deg)', 'none'] }, 280);
          };
        }
        setTimeout(function () { // o texto volta entrando pela esquerda
          cl.add('is-reset'); void btn.offsetWidth;
          cl.remove('is-reset', 'is-sending', 'is-still');
          if (still) cl.remove('is-away');
        }, still ? 0 : 250);
        setTimeout(function () { busy = false; sr.textContent = ''; }, still ? 400 : 950);
      }, +btn.getAttribute('data-upw-volta') || 1900);
    }
    btn.addEventListener('pointerdown', function(e){ if(e.button===0) send(); });
    btn.addEventListener('click', function (e) {
      var href = btn.getAttribute('href') || '#', go = href !== '#' && !/^javascript:/i.test(href);
      var tab = e.ctrlKey || e.metaKey || e.shiftKey || btn.target === '_blank';
      if (!go || !tab) e.preventDefault(); // "#" só anima; link normal abre depois da decolagem
      if (!busy) send();
      if (go && !tab) setTimeout(function () { location.href = btn.href; }, 900);
    });
    btn.upwSend = send;
  });
})();
