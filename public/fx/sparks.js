/* Gold spark burst from the point where any link or button is pressed.
   One shared script for the whole site: the React pages and the quotation
   pages both load it, so every menu and button behaves the same.

   - Starts on pointer-down for mouse and pen, so the burst is already under
     way when a link starts loading the next page; on touch it waits for the
     tap (click), so scrolling past a link doesn't set it off.
   - Each spark travels a gentle arc with a soft glow, and a faint ring
     spreads from the press point. Everything is animated with the Web
     Animations API on transform and opacity only, so it stays on the
     compositor and runs smoothly, then removes itself.
   - Skipped for visitors who ask for reduced motion. Add data-nospark to an
     element to keep it quiet. */
(function () {
  'use strict';
  if (window.__dpplSparks) return;
  window.__dpplSparks = true;
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!Element.prototype.animate) return;
  } catch (e) { return; }

  var COLOURS = ['#D8B36A', '#E9CA85', '#FFF3D6', '#C9A251', '#F4DFA6'];
  var TARGET = 'a, button, summary, [role="button"], label.switch, .btn-copy';
  var lastAt = 0;
  var mouseDownAt = -1e9; // a mouse press already burst; its click shouldn't again

  function el(tag, css) {
    var n = document.createElement(tag);
    for (var k in css) n.style[k] = css[k];
    return n;
  }

  function burst(x, y) {
    var now = performance.now();
    if (now - lastAt < 40) return;
    lastAt = now;

    var layer = el('div', { position: 'fixed', left: x + 'px', top: y + 'px', width: '0', height: '0', zIndex: '2147483000', pointerEvents: 'none' });
    layer.setAttribute('aria-hidden', 'true');

    var ring = el('span', {
      position: 'absolute', left: '-18px', top: '-18px', width: '36px', height: '36px',
      borderRadius: '50%', border: '1.5px solid rgba(233, 202, 133, 0.75)', opacity: '0',
    });
    layer.appendChild(ring);

    var n = 16;
    var sparks = [];
    for (var i = 0; i < n; i += 1) {
      var size = 3 + Math.random() * 3;
      var colour = COLOURS[i % COLOURS.length];
      var s = el('span', {
        position: 'absolute', left: -size / 2 + 'px', top: -size / 2 + 'px', width: size + 'px', height: size + 'px',
        borderRadius: '50%', background: colour, boxShadow: '0 0 6px 1px ' + colour, opacity: '0',
        willChange: 'transform, opacity',
      });
      layer.appendChild(s);
      sparks.push(s);
    }
    document.body.appendChild(layer);

    ring.animate(
      [
        { transform: 'scale(0.2)', opacity: 0.85 },
        { transform: 'scale(1.6)', opacity: 0 },
      ],
      { duration: 560, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
    );

    var longest = 0;
    sparks.forEach(function (s, i) {
      var angle = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.35;
      var dist = 28 + Math.random() * 30;
      var dx = Math.cos(angle) * dist;
      var dy = Math.sin(angle) * dist;
      var fall = 10 + Math.random() * 8; // a touch of gravity at the end of the arc
      var duration = 680 + Math.random() * 240;
      longest = Math.max(longest, duration);
      s.animate(
        [
          { transform: 'translate3d(0, 0, 0) scale(0.5)', opacity: 1 },
          { transform: 'translate3d(' + dx * 0.72 + 'px, ' + dy * 0.72 + 'px, 0) scale(1)', opacity: 1, offset: 0.42 },
          { transform: 'translate3d(' + dx + 'px, ' + (dy + fall) + 'px, 0) scale(0.25)', opacity: 0 },
        ],
        { duration: duration, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)', fill: 'forwards' },
      );
    });

    setTimeout(function () { layer.remove(); }, longest + 80);
  }

  function from(e) {
    var t = e.target && e.target.closest ? e.target.closest(TARGET) : null;
    return t && !t.hasAttribute('data-nospark') && !t.disabled ? t : null;
  }

  document.addEventListener('pointerdown', function (e) {
    try {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      mouseDownAt = performance.now();
      if (from(e)) burst(e.clientX, e.clientY);
    } catch (err) { /* decoration only */ }
  }, { capture: true, passive: true });

  document.addEventListener('click', function (e) {
    try {
      if (!e.clientX && !e.clientY) return; // keyboard activation
      if (performance.now() - mouseDownAt < 1500) return; // mouse: already burst on press
      if (from(e)) burst(e.clientX, e.clientY);
    } catch (err) { /* decoration only */ }
  }, true);
})();
