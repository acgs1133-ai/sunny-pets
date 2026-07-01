(function () {
  'use strict';

  var WA = 'https://wa.me/5534997653344';
  var SECTIONS = ['top', 'servicos', 'banho', 'tosa', 'daycare', 'estudio', 'sobre', 'contato'];

  // rAF-throttle helper: coalesces bursty scroll/resize events into at most
  // one callback per frame, and stops scheduling once the page is idle
  // (instead of a perpetual requestAnimationFrame loop that runs forever).
  function rafThrottle(fn) {
    var scheduled = false;
    return function () {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () {
        scheduled = false;
        fn();
      });
    };
  }

  // ===== Header scroll state + scroll-spy =====
  var header = document.getElementById('site-header');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.sp-navlink'));

  function updateSpy() {
    var vh = window.innerHeight || 800;
    var current = 'top';
    for (var i = 0; i < SECTIONS.length; i++) {
      var el = document.getElementById(SECTIONS[i]);
      if (el && el.getBoundingClientRect().top <= vh * 0.4) current = SECTIONS[i];
    }
    navLinks.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('data-section') === current);
    });
  }

  var onScrollOrResize = rafThrottle(function () {
    header.classList.toggle('is-scrolled', (window.scrollY || 0) > 30);
    updateSpy();
  });
  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize);
  onScrollOrResize();

  // ===== Mobile menu =====
  var burger = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobile-menu');
  function closeMenu() {
    burger.classList.remove('is-open');
    mobileMenu.classList.remove('is-open');
  }
  burger.addEventListener('click', function () {
    burger.classList.toggle('is-open');
    mobileMenu.classList.toggle('is-open');
  });
  Array.prototype.slice.call(mobileMenu.querySelectorAll('a')).forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });

  // ===== Reveal on scroll =====
  // IntersectionObserver toggles a class; the fade/rise itself is a CSS
  // transition (style.css .sp-reveal). No per-frame polling, so it costs
  // nothing while the user isn't actively crossing a section boundary — and
  // since it's just "are we intersecting right now", it fires again every
  // time an element re-enters the viewport, in either scroll direction.
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = document.querySelectorAll('.sp-reveal');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // ===== Parallax layers =====
  // Desktop-only (fine pointer + wide viewport): subtle depth on hero/section
  // photos. Skipped on touch/narrow screens on purpose — parallax transforms
  // fight momentum scrolling on phones and just add jank without adding much,
  // so mobile gets the lighter, cheaper reveal effect only.
  var canParallax = !reduceMotion && window.matchMedia &&
    window.matchMedia('(min-width: 981px) and (pointer: fine)').matches;
  if (canParallax) {
    var layers = Array.prototype.slice.call(document.querySelectorAll('[data-px]')).map(function (el) {
      el.style.willChange = 'transform';
      return { el: el, speed: parseFloat(el.getAttribute('data-px')) || 0, applied: 0 };
    });
    var parallaxScheduled = false;
    function updateParallax() {
      parallaxScheduled = false;
      var vh = window.innerHeight || 800;
      var vc = vh / 2;
      var settled = true;
      layers.forEach(function (l) {
        var rect = l.el.getBoundingClientRect();
        var center = rect.top + rect.height / 2;
        var target = (center - vc) * l.speed;
        l.applied += (target - l.applied) * 0.12;
        if (Math.abs(target - l.applied) > 0.05) settled = false;
        l.el.style.transform = 'translate3d(0,' + l.applied.toFixed(2) + 'px,0)';
      });
      if (!settled) scheduleParallax();
    }
    function scheduleParallax() {
      if (parallaxScheduled) return;
      parallaxScheduled = true;
      requestAnimationFrame(updateParallax);
    }
    window.addEventListener('scroll', scheduleParallax, { passive: true });
    window.addEventListener('resize', scheduleParallax);
    scheduleParallax();
  }

  // ===== Orçamento (price calculator) =====
  var calcState = { porte: 'pequeno', pelo: 'curto', linha: 'basic', adds: {} };
  var BASE = {
    pequeno: { curto: { basic: [60, 60], premium: [70, 70] }, longo: { basic: [70, 70], premium: [80, 80] } },
    medio: { curto: { basic: [80, 90], premium: [90, 100] }, longo: { basic: [80, 90], premium: [90, 100] } },
    grande: { curto: { basic: [110, 150], premium: [130, 160] }, longo: { basic: [110, 150], premium: [130, 160] } },
  };

  function fmt(n) { return 'R$' + (Number.isInteger(n) ? n : n.toFixed(2).replace('.', ',')); }

  function calc() {
    var range = BASE[calcState.porte][calcState.pelo][calcState.linha];
    var lo = range[0], hi = range[1];
    var parts = ['Banho ' + (calcState.linha === 'basic' ? 'Basic' : 'Premium')];
    if (calcState.adds.maqui) { lo += 150; hi += 150; parts.push('Tosa na máquina'); }
    if (calcState.adds.tesoura) { lo += 185; hi += 185; parts.push('Tosa na tesoura'); }
    if (calcState.adds.escova) { lo += 7; hi += 7; parts.push('Escovação'); }
    return { lo: lo, hi: hi, parts: parts };
  }

  var rangeEl = document.getElementById('calc-range');
  var summaryEl = document.getElementById('calc-summary');
  var waLinkEl = document.getElementById('calc-wa-link');
  var PORTE_LABEL = { pequeno: 'Pequeno porte', medio: 'Médio porte', grande: 'Grande porte' };
  var PORTE_SHORT = { pequeno: 'Pequeno', medio: 'Médio', grande: 'Grande' };

  function renderCalc() {
    var c = calc();
    var range = c.lo === c.hi ? fmt(c.lo) : fmt(c.lo) + ' – ' + fmt(c.hi);
    var peloLabel = calcState.pelo === 'curto' ? 'pelo curto' : 'pelo médio/longo';
    var peloShort = calcState.pelo === 'curto' ? 'Curto' : 'Médio / Longo';
    rangeEl.textContent = range;
    summaryEl.textContent = PORTE_LABEL[calcState.porte] + ', ' + peloLabel + ' — ' + c.parts.join(' + ') + '.';
    var waMsg = encodeURIComponent(
      'Olá, Sunny Pets! 🐾\n' +
      'Fiz uma estimativa no site:\n\n' +
      '• *Porte:* ' + PORTE_SHORT[calcState.porte] + '\n' +
      '• *Pelo:* ' + peloShort + '\n' +
      '• *Serviços:* ' + c.parts.join(' + ') + '\n' +
      '• *Faixa estimada:* ' + range + '\n\n' +
      'Gostaria de confirmar um horário. 😊'
    );
    waLinkEl.href = WA + '?text=' + waMsg;
  }

  function bindSegGroup(id, onSelect) {
    var group = document.getElementById(id);
    group.querySelectorAll('.sp-seg').forEach(function (btn) {
      btn.addEventListener('click', function () {
        onSelect(btn, group);
        renderCalc();
      });
    });
  }
  bindSegGroup('porte-group', function (btn, group) {
    group.querySelectorAll('.sp-seg').forEach(function (b) { b.classList.remove('is-active'); });
    btn.classList.add('is-active');
    calcState.porte = btn.getAttribute('data-value');
  });
  bindSegGroup('pelo-group', function (btn, group) {
    group.querySelectorAll('.sp-seg').forEach(function (b) { b.classList.remove('is-active'); });
    btn.classList.add('is-active');
    calcState.pelo = btn.getAttribute('data-value');
  });
  bindSegGroup('linha-group', function (btn, group) {
    group.querySelectorAll('.sp-seg').forEach(function (b) { b.classList.remove('is-active'); });
    btn.classList.add('is-active');
    calcState.linha = btn.getAttribute('data-value');
  });
  bindSegGroup('adds-group', function (btn) {
    var value = btn.getAttribute('data-value');
    if (value === 'maqui' || value === 'tesoura') {
      // mutually exclusive, like the original design
      var other = value === 'maqui' ? 'tesoura' : 'maqui';
      var otherBtn = document.querySelector('#adds-group [data-value="' + other + '"]');
      calcState.adds[other] = false;
      if (otherBtn) otherBtn.classList.remove('is-active');
    }
    calcState.adds[value] = !calcState.adds[value];
    btn.classList.toggle('is-active', !!calcState.adds[value]);
  });
  renderCalc();

  // ===== Gallery filter =====
  var galleryFilters = document.getElementById('gallery-filters');
  var galleryTiles = Array.prototype.slice.call(document.querySelectorAll('.sp-gtile'));
  galleryFilters.querySelectorAll('.sp-filter').forEach(function (btn) {
    btn.addEventListener('click', function () {
      galleryFilters.querySelectorAll('.sp-filter').forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      var filter = btn.getAttribute('data-filter');
      galleryTiles.forEach(function (tile) {
        var filters = (tile.getAttribute('data-filters') || '').split(' ');
        var show = filter === 'todos' || filters.indexOf(filter) !== -1;
        tile.hidden = !show;
      });
    });
  });

  // ===== FAQ accordion =====
  var faqButtons = Array.prototype.slice.call(document.querySelectorAll('.sp-faq-btn'));
  faqButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.sp-faq-item');
      var body = item.querySelector('.sp-faq-body');
      var sign = btn.querySelector('.sp-faq-sign');
      var isOpen = body.classList.contains('is-open');
      faqButtons.forEach(function (other) {
        var otherItem = other.closest('.sp-faq-item');
        otherItem.querySelector('.sp-faq-body').classList.remove('is-open');
        otherItem.querySelector('.sp-faq-sign').textContent = '+';
      });
      if (!isOpen) {
        body.classList.add('is-open');
        sign.textContent = '–';
      }
    });
  });
})();
