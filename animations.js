/*
  Animaciones — SB&NF Laboratorio (JS propio, sin librerías).
  - Los elementos solo se ocultan cuando este script confirma que cargó (clase html.anim).
  - ?captura=1 o prefers-reduced-motion: no se anima nada y todo queda en su estado final.
  - El header fijo, la barra inferior y los botones fijos no se animan; el script de la
    barra inferior (sección activa al hacer scroll) no se toca.
  - Solo se marca el diseño activo (escritorio >= 768 px, móvil < 768 px).
*/
(function () {
  'use strict';

  var root = document.documentElement;

  if (new URLSearchParams(window.location.search).get('captura') === '1') {
    root.classList.add('captura');
    return;
  }
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window) || !window.CSS || !CSS.supports('translate', '0 1px')) return;

  var desktop = window.matchMedia('(min-width: 768px)').matches;
  var ctx = document.getElementById(desktop ? 'desktop-root' : 'mobile-root');
  if (!ctx) return;

  function $$(selector) { return Array.prototype.slice.call(ctx.querySelectorAll(selector)); }
  function usable(el) {
    if (el.closest('[style*="display:none"]')) return false;
    var p = el;
    while (p && p !== ctx) { if (getComputedStyle(p).position === 'fixed') return false; p = p.parentElement; }
    return true;
  }

  var tagged = [];
  var heroItems = [];

  function tag(list, kind) {
    list.forEach(function (el) {
      if (el.hasAttribute('data-anim') || !usable(el)) return;
      el.setAttribute('data-anim', kind || 'rise');
    });
  }
  function cleanup() {
    root.classList.remove('anim');
    Array.prototype.forEach.call(document.querySelectorAll('[data-anim]'), function (el) {
      el.removeAttribute('data-anim');
      el.style.removeProperty('--sb-d');
      el.classList.remove('is-in', 'is-instant');
    });
  }

  function setup() {
    /* ---- Hero (al cargar): textos escalonados y luego la imagen ---- */
    var hero = [];
    if (desktop) {
      $$('#inicio > div > .grid > div:first-child > *').forEach(function (el, i) { hero.push({ el: el, delay: 100 + i * 90 }); });
      $$('#inicio > div > .grid > div:last-child').forEach(function (el) { hero.push({ el: el, delay: 520 }); });
    } else {
      $$('#m-inicio > div > *').forEach(function (el, i) { hero.push({ el: el, delay: Math.min(100 + i * 100, 700) }); });
    }
    hero = hero.filter(function (h) { return usable(h.el); });
    tag(hero.map(function (h) { return h.el; }), 'hero');
    heroItems = hero;

    /* ---- Secciones al hacer scroll ---- */
    var blocks = [];
    $$('main section').filter(function (s) { return s.id !== (desktop ? 'inicio' : 'm-inicio'); }).forEach(function (sec) {
      var holder = desktop ? sec.firstElementChild : sec;
      if (!holder) return;
      Array.prototype.forEach.call(holder.children, function (kid) {
        var kids = Array.prototype.slice.call(kid.children);
        var isList = kid.classList.contains('grid') ||
          (kids.length >= 2 && kids.every(function (c) { return c.classList.contains('rounded-xl'); }));
        if (isList) kids.forEach(function (c) { blocks.push(c); });
        else blocks.push(kid);
      });
    });
    $$('footer').forEach(function (f) { blocks.push(desktop && f.firstElementChild ? f.firstElementChild : f); });
    tag(blocks, 'rise');

    /* ---- Etiquetas rojas de promoción: leve fade + escala 0.95 -> 1, una sola vez ---- */
    tag($$('main [class*="bg-error"]'), 'pop');
    /* ---- Íconos en hexágonos: fade escalonado, sin girar ---- */
    tag($$('[class*="clip-path"]'), 'fade');

    $$('[data-anim]').forEach(function (el) {
      var k = el.getAttribute('data-anim');
      if (k !== 'hero' && tagged.indexOf(el) === -1) tagged.push(el);
    });

    /* ---- Hover (solo escritorio; los estilos están en animations.css) ---- */
    $$('a[href^="https://wa.me"], a[href^="tel:"]').forEach(function (a) { if (usable(a)) a.setAttribute('data-hover', 'btn'); });
    $$('#promociones .grid > div, #estudios .grid > div, #sucursales .grid > div').forEach(function (el) { el.setAttribute('data-hover', 'card'); });
    $$('#inicio .lg\\:col-span-5 > div').forEach(function (el) { el.setAttribute('data-hover', 'frame'); });

    root.classList.add('anim');

    function fire(el, delay, instant) {
      if (el.classList.contains('is-in')) return;
      if (instant) el.classList.add('is-instant');
      else el.style.setProperty('--sb-d', delay + 'ms');
      el.classList.add('is-in');
    }

    var io = new IntersectionObserver(function (entries) {
      var show = [];
      entries.forEach(function (e) {
        if (e.isIntersecting) show.push(e);
        else if (e.boundingClientRect.top < 0) { io.unobserve(e.target); fire(e.target, 0, true); }
      });
      show.sort(function (a, b) {
        var A = a.boundingClientRect, B = b.boundingClientRect;
        return (Math.round(A.top / 8) - Math.round(B.top / 8)) || (A.left - B.left);
      });
      show.forEach(function (e, i) {
        io.unobserve(e.target);
        var extra = e.target.getAttribute('data-anim') === 'pop' ? 250 : (e.target.getAttribute('data-anim') === 'fade' ? 150 : 0);
        fire(e.target, Math.min(i, 5) * 90 + extra, false); // escalonado ~90 ms
      });
    }, { threshold: 0.1, rootMargin: '0px' });

    tagged.forEach(function (el) { io.observe(el); });

    // Hero: arranca tras pintar el estado oculto
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        heroItems.forEach(function (h) { fire(h.el, h.delay, false); });
      });
    });
  }

  try { setup(); } catch (err) { cleanup(); }
})();
