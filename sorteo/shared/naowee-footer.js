/**
 * Naowee footer pill de versionamiento — Digitación.
 *
 * Pill flotante (esquina inferior derecha): logo + © + "Digitación vX.Y.Z"
 * con link al release en GitHub. Patrón portado de IVC (DESIGN-PATTERNS §3.8).
 *
 * Reglas clave:
 *  - Embed-aware: NO se monta si la página está embebida (data-embed="1"),
 *    para no flotar dentro del iframe del sidebar-shell host.
 *  - Scroll-hide en CAPTURE phase: el scroll real ocurre en `.page` (no en
 *    window) y NO burbujea — por eso se escucha en document con capture:true.
 *  - Anima solo transform/opacity; honra prefers-reduced-motion (vía CSS).
 *
 * Para versionar: cambia MODULE_VERSION (y los cache busters ?v= en los HTML).
 */
(function mountNaoweeFooter() {
  'use strict';

  var MODULE_NAME = 'Sorteo';
  var MODULE_VERSION = 'v2.1.1';
  var REPO = 'naowee-tech/naowee-test-digitacion';
  var RELEASE_URL = 'https://github.com/' + REPO + '/releases/tag/' + MODULE_VERSION;
  var LOGO_SRC = 'shared/logos/naowee.svg';

  /* No montar en modo embebido (el host provee su propio chrome). */
  if (document.documentElement.dataset.embed === '1') return;

  function mount() {
    if (document.querySelector('.naowee-floating-footer')) return;

    var footer = document.createElement('div');
    footer.className = 'naowee-floating-footer';
    footer.setAttribute('role', 'contentinfo');
    footer.innerHTML =
      '<img class="naowee-floating-footer__logo" src="' + LOGO_SRC + '" alt="Naowee" />' +
      '<span class="naowee-floating-footer__copy">© ' + new Date().getFullYear() +
        ' · Todos los derechos reservados</span>' +
      '<a class="naowee-floating-footer__ver" href="' + RELEASE_URL +
        '" target="_blank" rel="noopener noreferrer">' + MODULE_NAME + ' ' + MODULE_VERSION + '</a>';
    document.body.appendChild(footer);

    setupScrollHide(footer);
  }

  /* Scroll-hide: baja >4px → ocultar; sube → reaparecer.
     El host del scroll es `.page` (creado dinámico) o window — por eso
     escuchamos en document con capture:true (el scroll no burbujea). */
  function setupScrollHide(footer) {
    var lastY = getScrollY();
    document.addEventListener('scroll', function () {
      var y = getScrollY();
      var dy = y - lastY;
      if (Math.abs(dy) < 4) return;
      footer.classList.toggle('is-hidden', dy > 0 && y > 60);
      lastY = y;
    }, { passive: true, capture: true });
  }

  function getScrollY() {
    var page = document.querySelector('.page');
    if (page && page.scrollTop > 0) return page.scrollTop;
    return window.scrollY || document.documentElement.scrollTop || 0;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})();
