/* ════════════════════════════════════════════════════════════════
   Naowee chrome compartido — Digitación
   Portado del demo de Eventos (DESIGN-PATTERNS §3.8 / #1):
     · Footer flotante con logo (footer-aware: se eleva sobre los
       stage-footers de los flujos, bottom-right en el resto).
     · Demo role switcher inferior ("DEMO · avatar · Cambiar perfil")
       con roles agrupados + MODO DEMO + Reiniciar tour/demo.
   Embed-aware: no monta nada si data-embed="1".
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (document.documentElement.dataset.embed === '1') return;

  var MODULE_NAME = 'Digitación';
  var MODULE_VERSION = 'v2.2.1';
  var REPO = 'naowee-tech/naowee-test-digitacion';
  var RELEASE_URL = 'https://github.com/' + REPO + '/releases/tag/' + MODULE_VERSION;
  var PREFIXES = ['naowee-sorteo-', 'naowee-digitacion-', 'naowee_comp', 'naowee_new', 'naowee_lista'];
  var MODE_KEY = 'naowee-digitacion-demo-mode';
  var TOUR_KEY = 'naowee-digitacion-tour-seen';

  var ICONS = {
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    check:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>'
  };

  /* Roles de digitación (con persona demo, como en Eventos). */
  var ROLES = {
    coordinador: { code:'coordinador', userName:'Laura Méndez',   label:'Coordinador de eventos', color:'#d74009', avatar:'LM', home:'../sorteo/sorteo.html' },
    digitador:   { code:'digitador',   userName:'Carlos Restrepo', label:'Digitador',              color:'#1f78d1', avatar:'CR', home:'digitador.html' },
    admin:       { code:'admin',       userName:'Andrea Salas',    label:'Administrador',          color:'#1f8923', avatar:'AS', home:'coordinadores.html' }
  };
  var ROLE_GROUPS = [ { label:'Operación', codes:['coordinador','digitador','admin'] } ];

  function currentRoleCode() {
    var m = location.search.match(/[?&]role=([^&#]+)/);
    var c = m ? decodeURIComponent(m[1]) : '';
    return ROLES[c] ? c : 'coordinador';
  }

  var _toastTimer;
  function toast(msg) {
    var t = document.getElementById('dgToast');
    if (!t) { t = document.createElement('div'); t.id = 'dgToast'; t.setAttribute('role','status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('is-visible');
    clearTimeout(_toastTimer); _toastTimer = setTimeout(function(){ t.classList.remove('is-visible'); }, 2600);
  }
  function getMode() { var m = localStorage.getItem(MODE_KEY); return m === 'blank' || m === 'demo' ? m : 'demo'; }

  /* ── Footer pill (con logo) ── */
  function mountFooter() {
    if (document.querySelector('.naowee-footer')) return;
    var el = document.createElement('div');
    el.className = 'naowee-footer'; el.setAttribute('role','contentinfo');
    el.innerHTML =
      '<img src="naowee.svg" alt="Naowee" class="naowee-footer__logo" onerror="this.style.display=\'none\'"/>' +
      '<div class="naowee-footer__sep"></div>' +
      '<span class="naowee-footer__text">Todos los derechos reservados © ' + new Date().getFullYear() + '</span>' +
      '<div class="naowee-footer__sep"></div>' +
      '<a class="naowee-footer__version" href="' + RELEASE_URL + '" target="_blank" rel="noopener noreferrer">' +
        MODULE_NAME + ' <strong>' + MODULE_VERSION + '</strong></a>';
    document.body.appendChild(el);
    return el;
  }

  /* ── Demo role switcher ── */
  function mountSwitcher() {
    if (document.querySelector('.demo-role-switcher')) return;
    var cur = ROLES[currentRoleCode()];
    var renderItem = function (p) {
      var active = p.code === cur.code;
      return '<a class="demo-role-switcher__item' + (active ? ' is-active' : '') + '" href="#" data-role="' + p.code + '">' +
        '<span class="demo-role-switcher__item-avatar" style="background:' + p.color + '22;color:' + p.color + '">' + p.avatar + '</span>' +
        '<span class="demo-role-switcher__item-meta"><span class="demo-role-switcher__item-name">' + p.userName + '</span>' +
        '<span class="demo-role-switcher__item-role">' + p.label + '</span></span>' +
        (active ? '<span class="demo-role-switcher__check">' + ICONS.check + '</span>' : '') + '</a>';
    };
    var list = ROLE_GROUPS.map(function (g) {
      var items = g.codes.map(function (c) { return ROLES[c]; }).filter(Boolean).map(renderItem).join('');
      return items ? '<div class="demo-role-switcher__group-label">' + g.label + '</div>' + items : '';
    }).join('');

    var root = document.createElement('div');
    root.className = 'demo-role-switcher'; root.id = 'demoSwitcher';
    root.innerHTML =
      '<button class="demo-role-switcher__toggle" id="dgSwToggle" type="button" aria-haspopup="true" aria-expanded="false">' +
        '<span class="demo-role-switcher__badge">DEMO</span>' +
        '<span class="demo-role-switcher__avatar" style="background:' + cur.color + '22;color:' + cur.color + '">' + cur.avatar + '</span>' +
        '<span>Cambiar perfil</span>' +
        '<span class="demo-role-switcher__chev">' + ICONS.chevron + '</span>' +
      '</button>' +
      '<div class="demo-role-switcher__panel" role="menu">' +
        '<div class="demo-role-switcher__panel-label">CAMBIAR DE PERFIL (SIMULADO)</div>' +
        '<div class="demo-role-switcher__list">' + list + '</div>' +
        '<div class="demo-role-switcher__mode-section">' +
          '<div class="demo-role-switcher__mode-label">MODO DEMO</div>' +
          '<div class="demo-role-switcher__mode-switch" role="group" aria-label="Modo demo">' +
            '<button type="button" class="demo-role-switcher__mode-btn" data-mode="blank" title="Pantallas guiadas, sin datos de ejemplo">Guiado · vacío</button>' +
            '<button type="button" class="demo-role-switcher__mode-btn" data-mode="demo" title="Datos de ejemplo cargados para explorar">Libre · con datos</button>' +
          '</div>' +
        '</div>' +
        '<div class="demo-role-switcher__panel-footer">' +
          '<button type="button" class="demo-role-switcher__action" id="dgRestartTour">' + ICONS.refresh + '<span>Reiniciar tour</span></button>' +
          '<button type="button" class="demo-role-switcher__action demo-role-switcher__action--quiet" id="dgResetDemo" title="Limpia el state de la demo">Reiniciar demo</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);
    bindSwitcher(root);
    return root;
  }

  function bindSwitcher(root) {
    var toggle = root.querySelector('#dgSwToggle');
    toggle.addEventListener('click', function (e) { e.stopPropagation(); var o = root.classList.toggle('is-open'); toggle.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    document.addEventListener('click', function (e) { if (!root.contains(e.target)) root.classList.remove('is-open'); });

    root.querySelectorAll('[data-role]').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        var next = item.getAttribute('data-role'); if (!ROLES[next]) return;
        if (currentRoleCode() === next) { root.classList.remove('is-open'); return; }
        location.href = ROLES[next].home + '?role=' + next;
      });
    });

    var syncMode = function () { var c = getMode(); root.querySelectorAll('.demo-role-switcher__mode-btn').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.mode === c ? 'true' : 'false'); }); };
    syncMode();
    root.querySelectorAll('.demo-role-switcher__mode-btn').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation(); var m = b.dataset.mode; if (m === getMode()) return;
        localStorage.setItem(MODE_KEY, m); syncMode(); root.classList.remove('is-open');
        setTimeout(function () { toast(m === 'demo' ? 'Modo libre: datos de ejemplo cargados.' : 'Modo guiado: pantallas sin datos de ejemplo.'); }, 160);
      });
    });

    root.querySelector('#dgRestartTour').addEventListener('click', function (e) { e.stopPropagation(); localStorage.removeItem(TOUR_KEY); root.classList.remove('is-open'); toast('Tour reiniciado — se mostrará en tu próxima visita.'); });

    root.querySelector('#dgResetDemo').addEventListener('click', function (e) {
      e.stopPropagation();
      if (window.confirm('¿Reiniciar la demo? Se borran los sorteos publicados y la programación que creaste.')) {
        [sessionStorage, localStorage].forEach(function (store) {
          for (var i = store.length - 1; i >= 0; i--) {
            var k = store.key(i);
            if (k && PREFIXES.some(function (p) { return k.indexOf(p) === 0; })) store.removeItem(k);
          }
        });
        location.reload();
      }
    });
  }

  /* ── Scroll-hide del pill + ocultar chrome cuando hay footer de flujo PEGADO ──
     Paridad Eventos: el pill (bottom-right) se oculta al hacer scroll hacia abajo
     y reaparece al subir; el switcher se queda fijo abajo-centro. Si una etapa
     muestra un footer pegado al fondo del viewport (.stage-footer / .wz-nav con
     position sticky|fixed), ocultamos AMBOS para no taparlo. El .wz-nav NO sticky
     (pasos 1/2 del wizard, en flujo dentro del card) NO cuenta — por eso el chrome
     se queda abajo y no "sube" a medio card (bug del lift anterior). */
  function getScrollY() {
    var p = document.querySelector('.page');
    if (p && typeof p.scrollTop === 'number' && p.scrollTop > 0) return p.scrollTop;
    return window.scrollY || document.documentElement.scrollTop || 0;
  }
  function pinnedFooterPresent() {
    var fs = document.querySelectorAll('.stage-footer, .wz-nav');
    var vh = window.innerHeight;
    for (var i = 0; i < fs.length; i++) {
      var f = fs[i], cs = window.getComputedStyle(f);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      if (cs.position !== 'sticky' && cs.position !== 'fixed') continue; // solo footers pegados
      if (f.offsetParent === null && cs.position !== 'fixed') continue;   // etapa oculta
      var r = f.getBoundingClientRect();
      if (r.height < 10) continue;
      if (r.bottom >= vh - 6 && r.top < vh) return true;                  // pegado al fondo
    }
    return false;
  }

  var _pill, _sw, _lastY = null;
  function refreshPinned() {
    var pinned = pinnedFooterPresent();
    if (pinned) {
      if (_pill) _pill.classList.add('is-hidden');
      if (_sw) _sw.classList.add('is-hidden');
    } else {
      if (_sw) _sw.classList.remove('is-hidden');
      if (_pill && getScrollY() <= 60) _pill.classList.remove('is-hidden');
    }
    return pinned;
  }
  function onScroll() {
    if (refreshPinned()) { _lastY = getScrollY(); return; }
    var y = getScrollY();
    if (_lastY === null) { _lastY = y; return; }
    var dy = y - _lastY;
    if (Math.abs(dy) < 60 && y > 0) return;                  // umbral 60px (paridad Eventos)
    if (_pill) _pill.classList.toggle('is-hidden', dy > 0 && y > 60);
    _lastY = y;
  }

  /* ── Quitar el cambio de perfil del pill superior (el switcher inferior lo asume) ── */
  function neutralizeTopSwitchers() {
    var header = document.querySelector('.top-header');
    if (!header) return;
    header.querySelectorAll('.profile-dropdown').forEach(function (d) { d.style.display = 'none'; });
    header.querySelectorAll('.user-chip').forEach(function (c) {
      c.onclick = null; c.style.cursor = 'default'; c.classList.add('is-static');
      var chev = c.querySelector('.uc-chev'); if (chev) chev.style.display = 'none';
      var sv = c.querySelector(':scope > svg:last-child'); if (sv) sv.style.display = 'none'; // chevron sin clase
    });
    var hasUserChip = !!header.querySelector('.user-chip');
    header.querySelectorAll('.profile-current').forEach(function (p) {
      if (hasUserChip) { p.style.display = 'none'; return; }   // pill redundante (solo-switcher)
      p.onclick = null; p.style.cursor = 'default'; p.classList.add('is-static');
      var sv = p.querySelector('svg:last-child'); if (sv) sv.style.display = 'none';
    });
  }

  function mount() {
    _pill = mountFooter();
    _sw = mountSwitcher();
    neutralizeTopSwitchers();
    _lastY = getScrollY();
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', refreshPinned, { passive: true });
    setInterval(refreshPinned, 280); // detecta cambios de etapa (showStage no dispara scroll)
    refreshPinned();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
