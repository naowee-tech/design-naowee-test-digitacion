/* ============================================================================
   Digitación · SORTEO — TOUR GUIADO por HU (verificación de Danna)
   Capa de ayuda ADITIVA: por cada historia de usuario del sorteo muestra
   TAREA + PROPÓSITO + spotlight de dónde mirar/hacer clic + "Paso N de M".
   Lanzador flotante abajo-derecha que lista las 8 HU por FASE del flujo; al
   elegir una, POSICIONA la demo en su stage (single-page: sin recarga) y corre
   los pasos. No toca la lógica del sorteo: sólo llama funciones globales ya
   existentes (selTipo/goStep/startClasificados/setModo/continueSorteo/
   showPreview/buildSorteo/reSortear) y lee/resalta el DOM.
   Fuente de las HU: "HU - Sorteo de equipos.xlsx" (Danna).
   ========================================================================== */
(function () {
  'use strict';
  if (window.__sorteoTour) return; window.__sorteoTour = true;

  function qs(k) { return new URLSearchParams(location.search).get(k); }
  function G(name) { return (typeof window[name] === 'function') ? window[name] : null; }
  function call(name, arg) { var f = G(name); if (f) { try { return f(arg); } catch (e) {} } }

  // ── Equipos demo (institución + "Región · Municipio") — paridad con el sorteo real ──
  var META = {
    'I.E. La Salle de Cartagena': 'Norte · Cartagena',
    'Colegio Champagnat de Valledupar': 'Norte · Valledupar',
    'I.E. Antonio Nariño de Montería': 'Norte · Montería',
    'Liceo Los Andes de Tunja': 'Centro · Tunja'
  };
  var T = Object.keys(META);
  function _tabla(names) { return names.map(function (n) { return { equipo: n, pj: 0, pg: 0, pp: 0, pts: 0 }; }); }
  // Grupo de 4 equipos, todos contra todos (6 partidos en 3 jornadas)
  var DEMO_GRUPOS = {
    sisCls: 'grupos', nombre: 'Fútbol · Sub-18 · Masculino', emoji: '⚽',
    deporte: 'Fútbol', categoria: 'Sub-18', genero: 'Masculino',
    sistema: 'Fase de grupos · todos contra todos', region: 'Norte', jornadasCount: 3,
    teamMeta: META,
    grupos: [{
      nombre: 'Grupo A', equipos: T.slice(),
      partidos: [
        { id: 'd1', jornada: 1, t1: T[0], t2: T[1], status: 'pending' },
        { id: 'd2', jornada: 1, t1: T[2], t2: T[3], status: 'pending' },
        { id: 'd3', jornada: 2, t1: T[0], t2: T[2], status: 'pending' },
        { id: 'd4', jornada: 2, t1: T[1], t2: T[3], status: 'pending' },
        { id: 'd5', jornada: 3, t1: T[0], t2: T[3], status: 'pending' },
        { id: 'd6', jornada: 3, t1: T[1], t2: T[2], status: 'pending' }
      ], tabla: _tabla(T)
    }]
  };
  // Grupo de 3 equipos (impar) → cada jornada uno "Descansa" (by)
  var B = T.slice(0, 3);
  var DEMO_BYE = {
    sisCls: 'grupos', nombre: 'Fútbol · Sub-18 · Masculino', emoji: '⚽',
    deporte: 'Fútbol', categoria: 'Sub-18', genero: 'Masculino',
    sistema: 'Fase de grupos · todos contra todos', region: 'Norte', jornadasCount: 3,
    teamMeta: META,
    grupos: [{
      nombre: 'Grupo A', equipos: B.slice(),
      partidos: [
        { id: 'b1', jornada: 1, t1: B[0], t2: B[1], status: 'pending' },
        { id: 'b1x', jornada: 1, t1: B[2], t2: 'Descansa', status: 'bye' },
        { id: 'b2', jornada: 2, t1: B[0], t2: B[2], status: 'pending' },
        { id: 'b2x', jornada: 2, t1: B[1], t2: 'Descansa', status: 'bye' },
        { id: 'b3', jornada: 3, t1: B[1], t2: B[2], status: 'pending' },
        { id: 'b3x', jornada: 3, t1: B[0], t2: 'Descansa', status: 'bye' }
      ], tabla: _tabla(B)
    }]
  };

  // Posiciona la demo en el previewStage con un resultado de sorteo demo.
  // setModo('auto') primero: showPreview oculta #btnResortear cuando el modo
  // es 'transcrip', y HU-06 lo deja pegado. Sin esto HU-08 se queda sin target.
  function gotoPreview(comp) { call('setModo', 'auto'); call('buildSorteo'); var f = G('showPreview'); if (f) { try { f(comp); } catch (e) {} } }
  // Posiciona la demo en el stage de sorteo en vivo (modo manual = estable, no auto-avanza).
  // El wizard nace sin prueba y selTipo() la resetea, asi que al saltar al
  // paso 3 el resumen salia con el emoji de reserva, titulo vacio y dos
  // badges vacios. Se siembra por los dropdowns reales (ddPick, lo mismo que
  // hace el usuario) la misma prueba que ya usan las HU de preview:
  // Futbol - Sub-18 - Masculino. Verificado que no choca con RN-SORTEO-UNICO.
  function _opt(scope, val) {
    return document.querySelector(scope + ' .naowee-dropdown__option[data-value="' + val + '"]')
        || document.querySelector(scope + ' .naowee-dropdown__option');
  }
  function seedPrueba() {
    var pick = G('ddPick'); if (!pick) return;
    // el deporte primero: es quien destapa categoria y sexo
    [['#ddDeporte-menu', 'f_tbol', 'ddDeporte'],
     ['#ddCategoria', 'Sub-18', 'ddCategoria'],
     ['#ddSexo', 'Masculino', 'ddSexo']].forEach(function (t) {
      var el = _opt(t[0], t[1]); if (el) { try { pick(t[2], el); } catch (e) {} }
    });
  }
  function gotoSorteoVivo() { call('selTipo', 'conjunto'); call('setModo', 'manual'); call('startClasificados'); call('continueSorteo'); }
  function gotoTranscrip() { call('selTipo', 'conjunto'); call('setModo', 'transcrip'); call('startClasificados'); call('continueSorteo'); }

  // ── Catálogo de tours por HU (8 HU del xlsx de Danna) ──
  var TOURS = {
    'HU-01': {
      ph: '1 · Parametrización',
      title: 'Parametrización del sorteo',
      purpose: 'Parametrizar la prueba (deporte, categoría y sexo), el número de equipos, la cantidad de grupos y el sistema de competencia, para ejecutar el sorteo con la configuración correcta. Solo el administrador configura y ejecuta.',
      steps: [
        { pre: function () { call('backToWizard'); call('selTipo', 'conjunto'); call('goStep', 1); }, sel: '#panel1 .wz-pills', body: 'Elige el <b>tipo de deporte</b>: de conjunto (grupos) o individual (llaves).' },
        { pre: seedPrueba, sel: '#fDeporte, #ddDeporte', body: 'Selecciona <b>deporte, categoría y sexo</b>. Cada prueba (deporte + categoría + sexo) es un sorteo independiente.' },
        { pre: function () { call('goStep', 2); }, sel: '#inEquipos', body: 'Define el <b>N.º de equipos clasificados</b> y el <b>N.º de grupos</b>.' },
        { sel: '#sistemaTxt', body: 'El <b>sistema de competencia</b> se deriva del número de equipos (todos contra todos), no del deporte. Si son impares, se genera un <b>“by”/descanso</b>.' },
        { sel: '#modoSeg', body: 'Elige el <b>modo</b>: <b>Automático</b>, <b>Manual</b> o <b>Ya sorteado</b> (el sorteo lo hizo un ente externo y aquí solo se registra).' },
        { pre: function () { call('goStep', 3); }, sel: '#summaryBox', body: 'Revisa el <b>resumen de confirmación</b> con todos los parámetros antes de ejecutar el sorteo.' }
      ]
    },
    'HU-02': {
      ph: '2 · Clasificados',
      title: 'Carga y validación de equipos clasificados',
      purpose: 'Cargar y validar los equipos clasificados de cada regional antes del sorteo. El sistema los reconoce automáticamente (primer clasificado de cada etapa), con validación manual previa.',
      steps: [
        { pre: function () { call('selTipo', 'conjunto'); call('startClasificados'); }, sel: '#clasifList', body: 'El sistema <b>carga los equipos clasificados</b> de la etapa previa (regional, departamental…) para esta prueba.' },
        { sel: '#clasifList .clasif-row', body: 'Cada equipo muestra el <b>detalle de su delegación</b>: institución + región y municipio.' },
        { sel: '.clasif-combo', body: 'Puedes <b>ajustar manualmente</b> quién ocupa cada cupo, y <b>fijar un equipo a un grupo</b> con las pastillas A/B/C. La <b>cantidad</b> de cupos la manda <b>Parámetros</b>: para cambiarla se vuelve a ese paso.' },
        { sel: '#btnClasifNext', body: 'Confirma la lista para continuar. Una vez iniciado el sorteo, <b>queda bloqueada</b> para edición.' }
      ]
    },
    'HU-03': {
      ph: '3 · Sorteo',
      title: 'Ejecución del sorteo (ruleta)',
      purpose: 'Ejecutar el sorteo mediante una ruleta que distribuye aleatoriamente los equipos clasificados en los grupos configurados, de forma rápida, visual y transparente.',
      steps: [
        { pre: gotoSorteoVivo, sel: '#manualWheel, .ruleta-carousel', body: 'El sorteo se ejecuta con una <b>ruleta</b> que distribuye los equipos <b>aleatoriamente</b> en los grupos.' },
        { sel: '#btnGirar', body: 'Cada <b>giro</b> saca un equipo y lo asigna a un grupo. En modo <b>Automático</b>, el sistema arma todos los grupos al instante.' },
        { sel: '#manualGrupos', body: 'Los equipos van cayendo en sus grupos. Si el número es impar, se incluye un <b>“by”/descanso</b>. El sorteo es por prueba y ágil para ejecutar varias seguidas.' }
      ]
    },
    'HU-06': {
      ph: '3 · Sorteo',
      title: 'Transcripción de sorteo externo',
      purpose: 'Transcribir y publicar el resultado de un sorteo realizado por un ente externo (federación u otro organizador), en formato de grupos o de llave de eliminación directa.',
      steps: [
        { pre: gotoTranscrip, sel: '#tFmtSeg', body: 'Esta HU es el modo que en pantalla se llama <b>“Ya sorteado”</b>. Elige el <b>formato</b> del sorteo externo: <b>Grupos</b> o <b>Llave</b> (eliminación directa).' },
        { sel: '#tBody', body: 'Registra los <b>grupos y sus enfrentamientos</b>, o el <b>bracket completo</b> por ronda (octavos, cuartos, semifinal, final).' },
        { sel: '#btnTranscrip', body: 'Conforma. Queda visible en la <b>página pública</b> igual que un sorteo interno, con su misma trazabilidad.' }
      ]
    },
    'HU-04': {
      ph: '4 · Resultado',
      title: 'Generación automática de enfrentamientos',
      purpose: 'Generar automáticamente los enfrentamientos de cada grupo (todos contra todos) una vez realizado el sorteo, listos por fecha y sin intervención manual.',
      steps: [
        { pre: function () { gotoPreview(DEMO_GRUPOS); }, sel: '#previewTabs', body: 'Al confirmar el sorteo, el sistema <b>genera los enfrentamientos</b>: todos contra todos dentro de cada grupo.' },
        { sel: '#previewPanel .match-card, #previewPanel .cr-jornada-label', body: 'Cada enfrentamiento muestra <b>grupo, fecha y Equipo A vs Equipo B</b>. La hora y el escenario se agregan después, sin afectar el sorteo. El administrador no modifica los emparejamientos.' }
      ]
    },
    'HU-05': {
      ph: '4 · Resultado',
      title: 'Manejo de “by” o descanso',
      purpose: 'Gestionar automáticamente el “by”/descanso cuando el número de equipos es impar respecto a los grupos, para que el formato sea válido y ningún equipo quede sin enfrentamientos.',
      steps: [
        { pre: function () { gotoPreview(DEMO_BYE); }, sel: '#previewPanel .cr-bye-card', body: 'Con un número <b>impar</b> de equipos, se genera un <b>“by”</b>: el equipo emparejado con él aparece como <b>“Descansa”</b> esa fecha, diferenciado del resto, y avanza automáticamente.' }
      ]
    },
    'HU-07': {
      ph: '4 · Resultado',
      title: 'Publicación inmediata de resultados',
      purpose: 'Publicar de inmediato los grupos, enfrentamientos y llaves en la página pública del evento al confirmar el sorteo, para consulta en tiempo real.',
      steps: [
        { pre: function () { gotoPreview(DEMO_GRUPOS); }, sel: '#btnConfirmSorteo', body: 'Al <b>confirmar</b>, los grupos, enfrentamientos y llaves quedan visibles de inmediato en la <b>página pública</b>, sin pasos extra de publicación.' },
        { sel: '#previewHead', body: 'La <b>vista pública</b> muestra por prueba: deporte, categoría y sexo; los grupos con sus equipos; y los enfrentamientos por fecha. La <b>hora</b> se puede dejar vacía y el <b>escenario</b> en <b>“Sin asignar”</b>, y completarse luego desde <b>Programación</b>.' }
      ]
    },
    'HU-08': {
      ph: '5 · Trazabilidad',
      title: 'Trazabilidad y auditoría del sorteo',
      purpose: 'Registrar todas las acciones de cada sorteo (ejecuciones, re-sorteos, anulaciones y confirmaciones) con usuario, fecha, hora y parámetros, para transparencia y respaldo oficial.',
      steps: [
        { pre: function () { gotoPreview(DEMO_GRUPOS); }, sel: '#btnResortear', body: 'Antes de publicar puedes <b>re-sortear</b>. Un re-sorteo registra el <b>motivo y el usuario</b>, y deja el sorteo anterior como <b>“anulado”</b> en el historial.' },
        { center: true, body: 'Cada acción queda registrada en <b>Auditoría</b> (menú lateral) con usuario, fecha y hora: sorteos, re-sorteos, anulaciones y confirmaciones. Una corrección tras publicar sigue un proceso formal con su propia trazabilidad.' }
      ]
    }
  };
  var ORDER = ['HU-01', 'HU-02', 'HU-03', 'HU-06', 'HU-04', 'HU-05', 'HU-07', 'HU-08'];

  // ── Estado ──
  var curHu = null, curStep = 0, _retry = null, _curEl = null;

  // ── CSS (paleta naranja de digitación) ──
  function injectCSS() {
    if (document.getElementById('sorteoTourCSS')) return;
    var st = document.createElement('style'); st.id = 'sorteoTourCSS';
    st.textContent =
      '.tt-spot{position:fixed;border-radius:12px;box-shadow:0 0 0 9999px rgba(28,26,20,.55);z-index:9000;pointer-events:none;transition:top .25s,left .25s,width .25s,height .25s;border:2px solid var(--accent,#d74009);}' +
      '.tt-coach{position:fixed;z-index:9002;width:344px;max-width:calc(100vw - 28px);background:#fff;border-radius:16px;box-shadow:0 24px 60px -16px rgba(28,26,20,.42);pointer-events:auto;overflow:hidden;font-family:Inter,-apple-system,sans-serif;}' +
      '.tt-coach-h{display:flex;align-items:center;gap:8px;padding:13px 16px 0;}' +
      '.tt-chip{font-size:10px;font-weight:800;letter-spacing:.05em;color:var(--accent,#d74009);background:var(--orange-bg,#fff3e6);padding:3px 9px;border-radius:999px;text-transform:uppercase;}' +
      '.tt-phase{font-size:10.5px;font-weight:600;color:#9aa3af;}' +
      '.tt-x{margin-left:auto;background:none;border:0;cursor:pointer;color:#9aa3af;font-size:20px;line-height:1;padding:2px 4px;}' +
      '.tt-x:hover{color:#282834;}' +
      '.tt-title{font-size:16px;font-weight:800;color:#282834;padding:8px 16px 0;letter-spacing:-.2px;}' +
      '.tt-purpose{font-size:12px;color:#646587;padding:4px 16px 0;line-height:1.45;}' +
      '.tt-body{font-size:13.5px;color:#282834;padding:12px 16px 0;line-height:1.5;}' +
      '.tt-body b{color:var(--accent,#d74009);}' +
      '.tt-f{display:flex;align-items:center;gap:8px;padding:14px 16px 16px;margin-top:8px;}' +
      '.tt-count{font-size:11.5px;font-weight:700;color:#9aa3af;}' +
      '.tt-btns{margin-left:auto;display:flex;gap:8px;}' +
      '.tt-btn{font-family:inherit;font-size:12.5px;font-weight:700;border-radius:10px;padding:8px 15px;cursor:pointer;color:var(--accent,#d74009);background:#fff;border:1px solid var(--border-dark,#d0d4e6);transition:background .14s,border-color .14s,box-shadow .14s;}' +
      '.tt-btn:hover{background:var(--orange-bg,#fff3e6);border-color:var(--orange-border,#ffbf75);}' +
      '.tt-btn--p{color:#fff;border:1px solid transparent;background:var(--accent,#d74009);box-shadow:0 6px 16px -6px rgba(215,64,9,.5);}' +
      '.tt-btn--p:hover{background:var(--accent,#d74009);opacity:1;box-shadow:0 10px 24px -6px rgba(215,64,9,.5);}' +
      '.tt-launch{position:fixed;right:18px;bottom:18px;z-index:8000;display:flex;align-items:center;gap:8px;background:var(--accent,#d74009);border:0;border-radius:999px;padding:11px 17px;font-family:Inter,sans-serif;font-size:12.5px;font-weight:700;color:#fff;cursor:pointer;box-shadow:0 12px 30px -10px rgba(215,64,9,.55);}' +
      '.tt-launch:hover{box-shadow:0 16px 38px -10px rgba(215,64,9,.6);}' +
      '.tt-panel{position:fixed;right:18px;bottom:66px;z-index:8001;width:320px;max-height:72vh;overflow:auto;background:#fff;border:1px solid var(--border,#e7e9f3);border-radius:16px;box-shadow:0 20px 50px -14px rgba(28,26,20,.4);padding:8px;display:none;font-family:Inter,sans-serif;}' +
      '.tt-panel.open{display:block;}' +
      '.tt-launch.tt--raised{bottom:64px;}' +
      '.tt-panel.tt--raised{bottom:112px;}' +
      '.tt-panel-h{font-size:12.5px;font-weight:800;color:#282834;padding:8px 10px 2px;}' +
      '.tt-panel-sub{font-size:11px;color:#646587;padding:0 10px 8px;line-height:1.4;}' +
      '.tt-grp{font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#9aa3af;padding:12px 10px 4px;}' +
      '.tt-item{width:100%;display:flex;align-items:center;gap:9px;background:none;border:0;cursor:pointer;padding:8px 10px;border-radius:9px;text-align:left;font-family:inherit;}' +
      '.tt-item:hover{background:var(--orange-bg,#fff3e6);}' +
      '.tt-item-code{font-size:9.5px;font-weight:800;color:var(--accent,#d74009);background:var(--orange-bg,#fff3e6);border-radius:6px;padding:3px 6px;flex-shrink:0;min-width:44px;text-align:center;}' +
      '.tt-item-t{font-size:12.5px;font-weight:600;color:#282834;}' +
      '@media (prefers-reduced-motion:reduce){.tt-spot{transition:none;}}' +
      '@media (max-width:768px){.tt-coach{left:50%!important;transform:translateX(-50%);bottom:14px!important;top:auto!important;}}';
    document.head.appendChild(st);
  }

  // ── Lanzador + panel (índice de HU por fase) ──
  function renderLauncher() {
    if (document.getElementById('ttLaunch')) return;
    var b = document.createElement('button'); b.id = 'ttLaunch'; b.className = 'tt-launch';
    b.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M14.5 9.5L11 11l-1.5 3.5L13 13z"/></svg>Recorrido HU';
    b.onclick = function (e) { e.stopPropagation(); togglePanel(); };
    var p = document.createElement('div'); p.id = 'ttPanel'; p.className = 'tt-panel';
    var groups = {}, gOrder = [];
    ORDER.forEach(function (h) { var t = TOURS[h]; if (!groups[t.ph]) { groups[t.ph] = []; gOrder.push(t.ph); } groups[t.ph].push(h); });
    var html = '<div class="tt-panel-h">Recorrido guiado — Sorteo de equipos</div>'
      + '<div class="tt-panel-sub">Cada paso indica la tarea, el propósito (la HU) y dónde mirar.</div>';
    gOrder.forEach(function (ph) {
      html += '<div class="tt-grp">' + ph + '</div>';
      groups[ph].forEach(function (h) {
        html += '<button class="tt-item" data-hu="' + h + '"><span class="tt-item-code">' + h + '</span><span class="tt-item-t">' + TOURS[h].title + '</span></button>';
      });
    });
    p.innerHTML = html;
    document.body.appendChild(b); document.body.appendChild(p);
    // El footer flotante (naowee-footer.js, defer) monta después: sube el
    // lanzador/panel por encima para no pisar el pill de versión.
    (function raiseAboveFooter() {
      var tries = 0;
      (function check() {
        if (document.querySelector('.naowee-floating-footer, .t-verpill')) {
          b.classList.add('tt--raised'); p.classList.add('tt--raised'); return;
        }
        if (tries++ < 12) setTimeout(check, 200);
      })();
    })();
    p.querySelectorAll('.tt-item').forEach(function (it) {
      it.onclick = function (e) { e.stopPropagation(); togglePanel(false); start(it.dataset.hu); };
    });
    document.addEventListener('click', function (e) {
      var pan = document.getElementById('ttPanel');
      if (pan && pan.classList.contains('open') && !pan.contains(e.target) && e.target.id !== 'ttLaunch' && !(e.target.closest && e.target.closest('#ttLaunch'))) pan.classList.remove('open');
    });
  }
  function togglePanel(force) {
    var p = document.getElementById('ttPanel'); if (!p) return;
    if (force === false) p.classList.remove('open'); else p.classList.toggle('open');
  }

  // ── Arranque de un tour (single-page: posiciona el stage con step.pre) ──
  function start(hu) { if (!TOURS[hu]) return; curHu = hu; curStep = 0; renderStep(); }

  function findTarget(sel) {
    var els = sel.split(',').map(function (s) { return s.trim(); });
    for (var i = 0; i < els.length; i++) {
      var el = document.querySelector(els[i]);
      if (el && el.offsetParent !== null) return el;
    }
    return null;
  }
  function renderStep() {
    var t = TOURS[curHu]; if (!t) return; var step = t.steps[curStep];
    clearTimeout(_retry);
    if (step.pre) { try { step.pre(); } catch (e) {} }
    if (step.center) { paint(t, step, null); return; }
    var tries = 0;
    (function locate() {
      var el = findTarget(step.sel);
      if (el || tries > 16) { paint(t, step, el); return; }
      tries++; _retry = setTimeout(locate, 120);
    })();
  }
  function paint(t, step, el) {
    var spot = document.getElementById('ttSpot') || mk('div', 'tt-spot', 'ttSpot');
    var coach = document.getElementById('ttCoach') || mk('div', 'tt-coach', 'ttCoach');
    var last = curStep === t.steps.length - 1;
    _curEl = el || null;
    if (el) {
      placeSpot(spot, el);
      try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
      // Re-mide varias veces: los stages de preview pueblan su contenido de forma
      // asíncrona (renderPvTabs) y reflowean el header → el rect inicial "miente".
      [120, 300, 650, 1100, 1600].forEach(function (ms) {
        setTimeout(function () {
          if (curHu && _curEl === el && document.body.contains(el) && el.offsetParent !== null) { placeSpot(spot, el); positionCoach(coach, el); }
        }, ms);
      });
    } else {
      spot.style.display = 'none';
    }
    coach.innerHTML =
      '<div class="tt-coach-h"><span class="tt-chip">' + curHu + '</span><span class="tt-phase">' + t.ph + '</span><button class="tt-x" aria-label="Cerrar">&times;</button></div>'
      + '<div class="tt-title">' + t.title + '</div>'
      + '<div class="tt-purpose">' + t.purpose + '</div>'
      + '<div class="tt-body">' + step.body + '</div>'
      + '<div class="tt-f"><span class="tt-count">Paso ' + (curStep + 1) + ' de ' + t.steps.length + '</span>'
      + '<div class="tt-btns">'
      + (curStep > 0 ? '<button class="tt-btn" data-a="prev">Anterior</button>' : '')
      + '<button class="tt-btn tt-btn--p" data-a="' + (last ? 'done' : 'next') + '">' + (last ? 'Finalizar' : 'Siguiente') + '</button>'
      + '</div></div>';
    positionCoach(coach, el);
    coach.querySelector('.tt-x').onclick = endTour;
    coach.querySelectorAll('[data-a]').forEach(function (btn) {
      btn.onclick = function () {
        var a = btn.dataset.a;
        if (a === 'prev') { curStep = Math.max(0, curStep - 1); renderStep(); return; }
        if (a === 'done') { endTour(); return; }
        curStep = Math.min(t.steps.length - 1, curStep + 1); renderStep();
      };
    });
  }
  function placeSpot(spot, el) {
    var box = el.closest('.naowee-dropdown, .naowee-input-stepper, .naowee-segment, .wz-pills, .clasif-row, .match-card, .cr-bye-card, .naowee-tabs, .nav-row') || el;
    var r = box.getBoundingClientRect(), pad = 4;
    var br = getComputedStyle(box).borderTopLeftRadius || '8px', radius;
    if (br.indexOf('%') >= 0) radius = '50%';
    else { var n = parseFloat(br) || 0; radius = (n > 0 ? n + pad : 8) + 'px'; }
    spot.style.display = 'block';
    spot.style.top = (r.top - pad) + 'px';
    spot.style.left = (r.left - pad) + 'px';
    spot.style.width = (r.width + pad * 2) + 'px';
    spot.style.height = (r.height + pad * 2) + 'px';
    spot.style.borderRadius = radius;
  }
  function reposition() {
    if (!curHu) return;
    var coach = document.getElementById('ttCoach'), spot = document.getElementById('ttSpot');
    if (!coach) return;
    if (_curEl && document.body.contains(_curEl) && _curEl.offsetParent !== null) {
      if (spot) placeSpot(spot, _curEl);
      positionCoach(coach, _curEl);
    } else if (spot) { spot.style.display = 'none'; positionCoach(coach, null); }
  }
  function positionCoach(coach, el) {
    coach.style.display = 'block';
    var cw = 344, ch = coach.offsetHeight || 240, m = 14;
    var top, left;
    if (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom + ch + m < window.innerHeight) top = r.bottom + m;
      else if (r.top - ch - m > 0) top = r.top - ch - m;
      else top = Math.max(m, (window.innerHeight - ch) / 2);
      left = Math.min(Math.max(m, r.left), window.innerWidth - cw - m);
    } else {
      top = (window.innerHeight - ch) / 2; left = (window.innerWidth - cw) / 2;
    }
    coach.style.top = top + 'px'; coach.style.left = left + 'px';
  }
  function mk(tag, cls, id) { var e = document.createElement(tag); e.className = cls; e.id = id; document.body.appendChild(e); return e; }
  function endTour() {
    clearTimeout(_retry); curHu = null; _curEl = null;
    ['ttSpot', 'ttCoach'].forEach(function (id) { var e = document.getElementById(id); if (e) e.remove(); });
    if (qs('tour')) { var u = new URL(location.href); u.searchParams.delete('tour'); history.replaceState(null, '', u); }
  }
  window.addEventListener('resize', reposition);
  window.addEventListener('scroll', reposition, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && curHu) endTour(); });

  // ── Boot ──
  function boot() {
    injectCSS(); renderLauncher();
    var auto = qs('tour');
    if (auto && TOURS[auto]) setTimeout(function () { start(auto); }, 600);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
