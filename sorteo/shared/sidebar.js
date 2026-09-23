/**
 * Sidebar render + interactions.
 * Toma un roleCode (?role=...) y renderiza el sidebar correspondiente.
 *
 * Markup portado 1:1 desde naowee-test-incentivos:
 * - Sidebar con logos reales (Ministerio + separator + SUID)
 * - Burger button a la izquierda con rotación 180° en collapsed
 * - Header con profile-switcher (user-chip "Phil" estilo: avatar+dot+nombre+rol+chevron)
 * - Dropdown del profile-switcher con la lista de los roles disponibles
 */
import { ROLES, getMenuForRole, getIcon, findParentOfChild } from './menu-data.js';

const COLLAPSED_KEY = 'naowee-sidebar-collapsed';

/* URL del login al hacer "Cerrar sesión".
   - localhost (demo personal): preview local en :4400 (Keycloak theme)
   - producción (GitHub Pages): auth-screens-ui público
   Esto permite que ambos flujos cierren su ciclo end-to-end:
     Login → Sidebar shell → Logout → Login. */
const LOGIN_URL = (() => {
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '';
  return isLocal
    ? 'http://localhost:4400/.local-preview/login-preview.html'
    : 'https://naowee-tech.github.io/auth-screens-ui/01-login.html';
})();

/* ─── Roles relevantes para el módulo Digitación ───────────────────────
   El demo switcher y el "Cambiar a" del header solo muestran ESTOS roles
   (no los de otros módulos: escenarios, documentación, deportista, etc.),
   agrupados por la lógica de uso del módulo. */
/* Demo de Sorteo: el sorteo lo opera solo el Access Manager del evento
   (Daniel Barreto). ADMIN/ROOT lo verían por bypass en la suite real. */
const DIGITACION_ROLE_GROUPS = [
  { label: 'Evento', codes: ['ACCESS_MANAGER'] },
];
const DIGITACION_ROLE_CODES = DIGITACION_ROLE_GROUPS.flatMap((g) => g.codes);

/* Vista de inicio por rol dentro de la demo standalone. Al cambiar de
   usuario simulado se navega a la página propia del rol con ?role=, en vez
   de a perfil.html (que pertenece al host sidebar-shell y daría 404). */
/* ── Rol activo: URL primero, memoria de sesion despues ──────────────────────
   El rol viaja en ?role=. Si por cualquier motivo el query se pierde —un
   redirect que no lo propaga, un enlace pegado a medias, alguien editando la
   URL— el default de las paginas era 'ROOT' = Super Admin: la demo escalaba
   sola al rol MAS privilegiado y sin avisar, mostrando un menu que no
   correspondia. Aqui recordamos el ultimo rol visto en la sesion, para que la
   identidad no cambie a espaldas de quien navega. El default de arranque en
   frio sigue siendo ROOT (abrir una pagina suelta sin historial). */
const ROLE_KEY = 'naowee-sorteo-role';
export function resolveRoleCode(fallback) {
  const deLaUrl = new URLSearchParams(window.location.search).get('role');
  if (deLaUrl) {
    try { sessionStorage.setItem(ROLE_KEY, deLaUrl); } catch (e) {}
    return deLaUrl;
  }
  let recordado = null;
  try { recordado = sessionStorage.getItem(ROLE_KEY); } catch (e) {}
  return recordado || fallback || 'ACCESS_MANAGER';
}

/* Demo de Sorteo independiente: cualquier rol aterriza en la ruleta. */
function digitacionRoleHref(code) {
  return `sorteo.html?role=${code}`;
}

/* Estado del módulo para que navigateToActive pueda re-renderizar
   sin recargar la página (View Transitions hacen morph suave entre estados). */
const _state = { rootEl: null, role: null, onActiveChange: null };

export function mountSidebar({ rootEl, roleCode, activeId, onActiveChange }) {
  const role = ROLES[roleCode] || ROLES.ATHLETE;
  const sections = getMenuForRole(role.code);
  const isCollapsed = localStorage.getItem(COLLAPSED_KEY) === '1';

  _state.rootEl = rootEl;
  _state.role = role;
  _state.activeId = activeId;
  _state.onActiveChange = onActiveChange || null;

  rootEl.innerHTML = renderSidebar({ sections, activeId, isCollapsed });
  bindSidebarEvents(rootEl);
  setupTooltips(rootEl);
  setupScrollHint(rootEl);

  /* Notificar al consumidor el activeId inicial para que renderee la página */
  if (_state.onActiveChange) _state.onActiveChange(activeId, role);

  return { role, sections };
}

function renderSidebar({ sections, activeId, isCollapsed, options }) {
  return `
    <aside class="sidebar ${isCollapsed ? 'collapsed' : ''}" id="naoweeSidebar">
      <div class="sidebar-logo">
        <button class="burger-btn" id="sidebarToggle" aria-label="Colapsar menú">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="#282834" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
        <img src="shared/logos/ministerio.svg" alt="Ministerio del Deporte" class="sb-logo-img"/>
        <div class="logo-sep"></div>
        <img src="shared/logos/suid.png" alt="SUID" class="sb-logo-img"/>
      </div>

      <nav class="sidebar-nav" id="sidebarNav" role="navigation" aria-label="Menú principal">
        ${sections.map((s) => renderSection(s, activeId, options)).join('')}
      </nav>

      <button class="scroll-hint" id="scrollHint" type="button" aria-label="Hay más opciones — desplazate">
        <span class="scroll-hint__lbl">Ver más</span>
        <span class="scroll-hint__chev">${getIcon('chevron')}</span>
      </button>

      <div class="sidebar-bottom">
        <div class="nav-row" data-action="logout" data-has-children="false">
          <div class="icon">${getIcon('logout')}</div>
          <span class="lbl">Cerrar sesión</span>
        </div>
      </div>
    </aside>
  `;
}

function renderSection(section, activeId, options) {
  const itemsHtml = section.items.map((item) => renderItem(item, activeId, options)).join('');
  if (!section.section) return itemsHtml;
  return `
    <div class="nav-section">${section.section}</div>
    ${itemsHtml}
  `;
}

function renderItem(item, activeId, options) {
  const isActive = item.id === activeId;
  const hasChildren = item.children && item.children.length > 0;
  const childActive = hasChildren && item.children.some((c) => c.id === activeId);
  /* Cuando un sub-item está activo, el parent también se pinta como activo
     (barra naranja + label/icon en accent). El sub-item activo muestra un
     dot adicional como indicador secundario. */
  const isParentSelected = isActive || childActive;
  const expanded = childActive;

  return `
    <div class="nav-row ${isParentSelected ? 'active' : ''} ${expanded ? 'expanded' : ''}"
         data-id="${item.id}"
         data-route="${item.route || ''}"
         data-has-children="${hasChildren ? 'true' : 'false'}">
      ${isParentSelected ? '<div class="active-bar"></div>' : ''}
      <div class="icon">${getIcon(item.icon)}</div>
      <span class="lbl">${item.label}</span>
      ${hasChildren ? `<span class="nav-arrow">${getIcon('chevron')}</span>` : ''}
    </div>
    ${hasChildren ? renderChildren(item.children, activeId, options) : ''}
  `;
}

function renderChildren(children, activeId) {
  /* El activo del subnivel se comunica por el texto en accent + el conector
     en árbol (sin dot naranja — paridad con el módulo Eventos). */
  return `
    <div class="sub-nav">
      ${children.map((c) => {
        const isActive = c.id === activeId;
        return `
        <div class="sub-row ${isActive ? 'active' : ''}"
             data-id="${c.id}"
             data-route="${c.route || ''}">
          <span class="lbl">${c.label}</span>
        </div>
      `;
      }).join('')}
    </div>
  `;
}

function bindSidebarEvents(rootEl) {
  const sidebar = rootEl.querySelector('.sidebar');
  const toggle = rootEl.querySelector('#sidebarToggle');

  if (toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      const collapsed = sidebar.classList.contains('collapsed');
      localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
    });
  }

  /* Nav-row click:
     - Si data-has-children="true" → expandir / colapsar (no navega)
     - Si no → navegar (preview-only) actualizando ?active=
     Usamos atributos explícitos en lugar de DOM walking para evitar
     issues con whitespace text nodes entre hermanos. */
  rootEl.querySelectorAll('.nav-row').forEach((row) => {
    row.addEventListener('click', (e) => {
      if (sidebar.classList.contains('collapsed')) return;
      e.stopPropagation();
      e.preventDefault();

      const hasChildren = row.getAttribute('data-has-children') === 'true';

      if (hasChildren) {
        row.classList.toggle('expanded');
        return;
      }

      const id = row.getAttribute('data-id');
      const action = row.getAttribute('data-action');
      if (action === 'logout') {
        window.location.href = LOGIN_URL;
        return;
      }
      if (!id) return;
      navigateToActive(id);
    });
  });

  /* Sub-row click: navegar al hijo (preview-only) */
  rootEl.querySelectorAll('.sub-row').forEach((row) => {
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const id = row.getAttribute('data-id');
      if (!id) return;
      navigateToActive(id);
    });
  });
}

/* Cambio de active SIN recargar la página, envuelto en View Transition.
   - Active-bar: siempre slidea entre parents (view-transition-name siempre).
   - Dot sub-item:
       · Mismo parent (intra-parent) → slidea entre hermanas
       · Distinto parent (cross-parent) → grow desde 0 (CSS subDotIn) */
/* ─── Ruteo centralizado del módulo Digitación (preview standalone) ────
   Cada id de menú → su página real en digitación, PRESERVANDO ?role= para
   que la página destino monte el menú del MISMO rol (no revierta a su
   default). Antes esto vivía duplicado en el LEGACY_MAP de cada HTML y
   perdía el rol al navegar → el coordinador terminaba como ROOT/Digitador
   o saltaba al shell host. Centralizado aquí: una sola fuente de verdad. */
const DIGI_ROUTES = {
  'event-draws': 'sorteo.html',
};
export function resolveDigiRoute(activeId, roleCode) {
  const page = DIGI_ROUTES[activeId];
  if (!page) return null;                       // ítem inerte en esta demo
  return page + '?role=' + encodeURIComponent(roleCode);
}

function navigateToActive(activeId) {
  const role = _state.role;
  const roleCode = role ? role.code : 'ATHLETE';
  /* Basename sin extensión: con URLs limpias (/sorteo) el pathname no trae
     '.html' y la comparación fallaba, redirigiendo a la página en la que ya
     estabas. */
  const baseName = (ruta) => (ruta.split('/').pop() || '').replace(/\.html$/, '');
  const currentFile = baseName(window.location.pathname);
  const url = resolveDigiRoute(activeId, roleCode);

  if (url) {
    if (baseName(url.split('?')[0]) === currentFile) {
      /* Ya estamos en la demo: volver a la raíz del módulo (promociones). */
      if (typeof window.openPromos === 'function') window.openPromos();
      return;
    }
    window.location.href = url;                       // navegación full, rol preservado
    return;
  }
  /* Demo de Sorteo: los demás ítems del menú de la suite son inertes.
     No se navega ni se cambia el activo, para no perder el contexto. */
}

function updateActive(activeId, options) {
  const { rootEl, role } = _state;
  if (!rootEl || !role) return;

  const sections = getMenuForRole(role.code);
  const isCollapsed = rootEl.querySelector('.sidebar')?.classList.contains('collapsed') || false;

  rootEl.innerHTML = renderSidebar({ sections, activeId, isCollapsed, options });
  bindSidebarEvents(rootEl);
  setupTooltips(rootEl);
  setupScrollHint(rootEl);

  _state.activeId = activeId;

  /* Sync title del placeholder por si la página lo usa */
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = `Vista — ${role.label}`;

  /* Notificar al consumidor el cambio de activeId para que renderee la página */
  if (_state.onActiveChange) _state.onActiveChange(activeId, role);
}

/* Soportar navegación browser back/forward sin perder estado */
window.addEventListener('popstate', () => {
  const params = new URLSearchParams(window.location.search);
  const activeId = params.get('active') || 'inicio';
  if (document.startViewTransition) {
    document.startViewTransition(() => updateActive(activeId));
  } else {
    updateActive(activeId);
  }
});

/* ─── Header user-chip + dropdown ──────────────────────────────────────
   Modelo A — el dropdown muestra solo los roles asignados al usuario.
   Estructura:
     · Header: avatar grande + nombre + email + rol activo (✓)
     · "Cambiar a" → solo si assignedRoles.length > 1
     · Mi perfil / Configuraciones / Notificaciones
     · Cerrar sesión (single source of truth — no más sidebar bottom)
   ────────────────────────────────────────────────────────────────────── */
export function mountHeader({ headerEl, role }) {
  const initials = (role.userName || role.label)
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0]).join('').toUpperCase();

  const assignedCodes = role.assignedRoles && role.assignedRoles.length > 0
    ? role.assignedRoles
    : [role.code];
  const otherAssignedRoles = assignedCodes
    .map((code) => ROLES[code])
    .filter(Boolean)
    .filter((r) => r.code !== role.code)
    .filter((r) => DIGITACION_ROLE_CODES.includes(r.code));

  const switchSection = otherAssignedRoles.length > 0 ? `
    <div class="profile-dd__sep"></div>
    <div class="profile-dd__label">Cambiar a</div>
    ${otherAssignedRoles.map((r) => {
      const ini = (r.userName || r.label).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
      return `
        <a class="profile-dd__item profile-dd__item--role" href="${digitacionRoleHref(r.code)}">
          <span class="ava-ring" style="width:30px;height:30px;font-size:11px;background:${r.color}22;color:${r.color}">${ini}</span>
          <div class="role-meta">
            <span>${r.label}</span>
            <small>${r.userName}</small>
          </div>
        </a>
      `;
    }).join('')}
  ` : '';

  headerEl.innerHTML = `
    <div class="profile-switcher" id="profileSwitcher">
      <div class="user-chip" id="userChipTrigger">
        <div class="ava">
          <div class="ava-ring" style="background:${role.color}22;color:${role.color}">${initials}</div>
          <div class="ava-dot"></div>
        </div>
        <div class="user-info">
          <span class="user-name">${role.userName || role.label}</span>
          <span class="user-role">${role.label}</span>
        </div>
        <button class="user-chip__chevron" type="button" aria-label="Abrir menú de cuenta">
          ${getIcon('chevron')}
        </button>
      </div>
      <div class="profile-dd" role="menu">
        <!-- Header con info del usuario y rol activo -->
        <div class="profile-dd__header">
          <span class="ava-ring" style="width:42px;height:42px;font-size:14px;background:${role.color}22;color:${role.color}">${initials}</span>
          <div class="profile-dd__user">
            <strong>${role.userName || role.label}</strong>
            <small>${role.userEmail || ''}</small>
            <span class="profile-dd__current-role" style="color:${role.color}">
              <span class="profile-dd__check-ico">${getIcon('check')}</span>
              ${role.label}
            </span>
          </div>
        </div>

        ${switchSection}
      </div>
    </div>
  `;

  bindHeaderEvents(headerEl);
}

function bindHeaderEvents(headerEl) {
  const switcher = headerEl.querySelector('#profileSwitcher');
  const trigger = headerEl.querySelector('#userChipTrigger');
  if (!switcher || !trigger) return;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    switcher.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!switcher.contains(e.target)) switcher.classList.remove('open');
  });
}

/* ─── Tooltips para sidebar colapsado ──────────────────────────────────
   En collapsed, hover sobre un item muestra tooltip a la altura del item
   pero al lado derecho (fuera del sidebar). Implementado con un único
   <div> en <body> + position:fixed para evitar issues con overflow:hidden
   del sidebar. */
let _tooltipEl = null;

function setupTooltips(rootEl) {
  const sidebar = rootEl.querySelector('.sidebar');
  if (!sidebar) return;

  if (!_tooltipEl) {
    _tooltipEl = document.createElement('div');
    _tooltipEl.className = 'nav-tooltip';
    document.body.appendChild(_tooltipEl);
  }

  function showTooltip(row) {
    if (!sidebar.classList.contains('collapsed')) return;
    const lblEl = row.querySelector('.lbl');
    if (!lblEl) return;
    _tooltipEl.textContent = lblEl.textContent.trim();
    const rect = row.getBoundingClientRect();
    _tooltipEl.style.left = `${rect.right + 12}px`;
    _tooltipEl.style.top = `${rect.top + rect.height / 2}px`;
    _tooltipEl.classList.add('is-visible');
  }
  function hideTooltip() {
    if (_tooltipEl) _tooltipEl.classList.remove('is-visible');
  }

  rootEl.querySelectorAll('.nav-row').forEach((row) => {
    row.addEventListener('mouseenter', () => showTooltip(row));
    row.addEventListener('mouseleave', hideTooltip);
  });

  /* Ocultar tooltip al colapsar/expandir el sidebar (estado cambió) */
  const observer = new MutationObserver(hideTooltip);
  observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
}

/* ─── Scroll hint (badge inferior cuando hay overflow) ─────────────────
   Aparece cuando .sidebar-nav tiene overflow Y el usuario no está cerca
   del bottom. Click en el badge → scrollea suave al final. */
function setupScrollHint(rootEl) {
  const nav = rootEl.querySelector('#sidebarNav');
  const hint = rootEl.querySelector('#scrollHint');
  if (!nav || !hint) return;

  function update() {
    const sidebar = rootEl.querySelector('.sidebar');
    if (sidebar?.classList.contains('collapsed')) {
      hint.classList.remove('is-visible');
      return;
    }
    const hasOverflow = nav.scrollHeight > nav.clientHeight + 2;
    /* Solo visible cuando hay overflow Y estamos arriba del todo.
       Al primer scroll desaparece — el usuario ya sabe que hay más
       opciones y el hint dejaría de ser útil para empezar a estorbar. */
    const isAtTop = nav.scrollTop < 4;
    hint.classList.toggle('is-visible', hasOverflow && isAtTop);
  }

  nav.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);

  hint.addEventListener('click', () => {
    nav.scrollTo({ top: nav.scrollHeight, behavior: 'smooth' });
  });

  /* Re-evaluar cuando cambia el estado del sidebar (collapsed) */
  const sidebar = rootEl.querySelector('.sidebar');
  if (sidebar) {
    const observer = new MutationObserver(update);
    observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
  }

  /* Ejecutar una vez para estado inicial — usar requestAnimationFrame
     para que las dimensiones ya estén calculadas */
  requestAnimationFrame(update);
}

/* ─── Demo role switcher (pill flotante — solo sandbox) ────────────────
   Permite alternar entre los 14 roles disponibles sin volver a index.html.
   Marcado claramente como "Demo" para diferenciarlo del avatar dropdown
   (que en producción sería el cambio entre roles asignados al usuario real).
   ─────────────────────────────────────────────────────────────────── */
export function mountDemoRoleSwitcher({ rootEl, currentRoleCode }) {
  const itemsHtml = DIGITACION_ROLE_GROUPS.map((g) => {
    const rolesHtml = g.codes.map((code) => {
      const r = ROLES[code];
      if (!r) return '';
      const ini = (r.userName || r.label).split(/\s+/).filter(Boolean).slice(0, 2)
        .map((w) => w[0]).join('').toUpperCase();
      const isActive = r.code === currentRoleCode;
      return `
      <a class="demo-role-switcher__item ${isActive ? 'is-active' : ''}"
         href="${digitacionRoleHref(r.code)}">
        <span class="demo-role-switcher__avatar"
              style="background:${r.color}22;color:${r.color}">${ini}</span>
        <div class="demo-role-switcher__meta">
          <strong>${r.label}</strong>
          <small>${r.userName}</small>
        </div>
        ${isActive ? `<span class="demo-role-switcher__check">${getIcon('check')}</span>` : ''}
      </a>
    `;
    }).join('');
    return `<div class="demo-role-switcher__group">${g.label}</div>${rolesHtml}`;
  }).join('');

  rootEl.innerHTML = `
    <div class="demo-role-switcher" id="demoRoleSwitcher">
      <button class="demo-role-switcher__toggle" type="button" id="demoSwitcherToggle">
        <span class="demo-role-switcher__badge">DEMO</span>
        <span class="demo-role-switcher__lbl">Cambiar de perfil</span>
        <span class="demo-role-switcher__chev">${getIcon('chevron')}</span>
      </button>
      <div class="demo-role-switcher__panel" role="menu">
        <div class="demo-role-switcher__panel-label">Cambiar de perfil (simulado)</div>
        <div class="demo-role-switcher__list">
          ${itemsHtml}
        </div>
      </div>
    </div>
  `;

  bindDemoRoleSwitcherEvents(rootEl);
}

function bindDemoRoleSwitcherEvents(rootEl) {
  const switcher = rootEl.querySelector('#demoRoleSwitcher');
  const toggle = rootEl.querySelector('#demoSwitcherToggle');
  const panel = rootEl.querySelector('.demo-role-switcher__panel');
  const list = rootEl.querySelector('.demo-role-switcher__list');
  if (!switcher || !toggle) return;

  /* Toggle has-overflow basado en scroll position de la lista.
     Indica visualmente (gradient fade en bottom) que hay más usuarios
     debajo de la zona visible. */
  function updateOverflow() {
    if (!panel || !list) return;
    const hasOverflow = list.scrollHeight > list.clientHeight + 4;
    const distanceFromBottom = list.scrollHeight - list.scrollTop - list.clientHeight;
    const isNearBottom = distanceFromBottom < 8;
    panel.classList.toggle('has-overflow', hasOverflow && !isNearBottom);
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    switcher.classList.toggle('open');
    if (switcher.classList.contains('open')) {
      requestAnimationFrame(updateOverflow);
    }
  });

  if (list) {
    list.addEventListener('scroll', updateOverflow, { passive: true });
  }
  window.addEventListener('resize', updateOverflow);

  document.addEventListener('click', (e) => {
    if (!switcher.contains(e.target)) switcher.classList.remove('open');
  });
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
export function getRoleFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get('role') || 'ATHLETE';
}
