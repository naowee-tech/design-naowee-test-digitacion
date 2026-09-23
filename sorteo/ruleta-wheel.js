/* ============================================================================
   ruleta-wheel.js — Componente de ruleta giratoria reutilizable (vanilla JS)
   Sorteo MANUAL: el usuario da clic, cada giro asigna un sector (equipo).
   Sin dependencias. Expone window.RuletaWheel.

   API:
     RuletaWheel.mount(containerEl, items)
        items: [{label:'Bogotá', color:'#2c5f9b'}, ...]
     RuletaWheel.spin()      -> Promise<number>  (índice ganador, o -1 si no quedan)
     RuletaWheel.remaining() -> number           (sectores no usados)
     RuletaWheel.total()     -> number           (total de sectores)
     RuletaWheel.reset()     -> void             (limpia usados y re-renderiza)

   Animación SOLO con transform/opacity. Honra prefers-reduced-motion.
   Rotación ACUMULATIVA: cada spin parte del ángulo actual y suma vueltas,
   nunca salta hacia atrás.
   ============================================================================ */
(function (global) {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  // --- Constantes de animación / geometría --------------------------------
  var SPIN_DURATION_MS = 2600;       // ~2.6s (debe coincidir con el CSS)
  var MIN_FULL_TURNS = 4;            // >= 4 vueltas completas
  var EXTRA_RANDOM_TURNS = 3;        // 0..3 vueltas extra aleatorias
  var VIEWBOX = 200;                 // lienzo SVG cuadrado
  var CENTER = VIEWBOX / 2;          // 100
  var RADIUS = 96;                   // radio del disco
  var LABEL_RADIUS = 62;             // radio donde se coloca el texto
  var MAX_LABEL_CHARS = 12;          // truncado del label

  // Estado interno del módulo (singleton)
  var state = {
    container: null,
    items: [],
    used: [],            // array de booleanos paralelo a items
    rotation: 0,         // ángulo acumulado actual de la rueda (grados)
    spinning: false,
    svg: null,           // <svg> que rota
    wedgeEls: [],        // nodos <g> por sector
    glowEls: [],         // overlays de glow ganador por sector
    rootEl: null,        // .ruleta
    reduceMotion: false
  };

  // ------------------------------------------------------------------------
  // Helpers de geometría
  // ------------------------------------------------------------------------

  // Convierte un ángulo (grados, 0° = derecha/Este, sentido horario positivo
  // en coordenadas SVG donde Y crece hacia abajo) a un punto en el borde.
  function polar(cx, cy, r, angleDeg) {
    var a = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  // Path de un arco (wedge) entre startAngle y endAngle (grados).
  function wedgePath(cx, cy, r, startAngle, endAngle) {
    var p1 = polar(cx, cy, r, startAngle);
    var p2 = polar(cx, cy, r, endAngle);
    var largeArc = (endAngle - startAngle) % 360 > 180 ? 1 : 0;
    return [
      'M', cx, cy,
      'L', p1.x.toFixed(3), p1.y.toFixed(3),
      'A', r, r, 0, largeArc, 1, p2.x.toFixed(3), p2.y.toFixed(3),
      'Z'
    ].join(' ');
  }

  function el(name, attrs) {
    var node = document.createElementNS(SVG_NS, name);
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) {
          node.setAttribute(k, attrs[k]);
        }
      }
    }
    return node;
  }

  function truncate(str) {
    str = String(str == null ? '' : str);
    if (str.length <= MAX_LABEL_CHARS) return str;
    return str.slice(0, MAX_LABEL_CHARS - 1) + '…';
  }

  // Aclara un color hex hacia blanco en un factor [0..1] (para el gradiente).
  function lighten(hex, amount) {
    var c = normalizeHex(hex);
    var r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
    r = Math.round(r + (255 - r) * amount);
    g = Math.round(g + (255 - g) * amount);
    b = Math.round(b + (255 - b) * amount);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function normalizeHex(hex) {
    hex = String(hex || '#888888').trim().replace('#', '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    var n = parseInt(hex, 16);
    return isNaN(n) ? 0x888888 : n;
  }

  // ------------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------------

  function render() {
    var items = state.items;
    var n = items.length;

    // Limpia y arma estructura del componente
    state.container.innerHTML = '';
    state.wedgeEls = [];
    state.glowEls = [];

    var root = document.createElement('div');
    root.className = 'ruleta';
    state.rootEl = root;

    var ring = document.createElement('div');
    ring.className = 'ruleta__ring';
    root.appendChild(ring);

    var svg = el('svg', {
      'class': 'ruleta__svg',
      viewBox: '0 0 ' + VIEWBOX + ' ' + VIEWBOX,
      role: 'img',
      'aria-label': 'Ruleta de sorteo con ' + n + ' sectores'
    });
    state.svg = svg;
    svg.style.transform = 'rotate(' + state.rotation + 'deg)';

    // Sectores planos: el degradado radial ensuciaba los tonos de marca.

    var sweep = n > 0 ? 360 / n : 360;

    for (var i = 0; i < n; i++) {
      // El sector i va de (i*sweep) a ((i+1)*sweep). Su CENTRO angular es:
      //   theta_i = i*sweep + sweep/2   (en grados, 0° = Este, horario)
      var start = i * sweep;
      var end = (i + 1) * sweep;
      var mid = start + sweep / 2;

      var g = el('g', { 'class': 'ruleta__wedge', 'data-index': i });

      var path = el('path', {
        'class': 'ruleta__wedge-path',
        d: wedgePath(CENTER, CENTER, RADIUS, start, end),
        fill: items[i].color || '#888888'
      });
      g.appendChild(path);

      // Overlay de glow ganador (mismo path, blanco translúcido)
      var glow = el('path', {
        'class': 'ruleta__winner-glow',
        d: wedgePath(CENTER, CENTER, RADIUS, start, end),
        fill: 'rgba(255,255,255,.9)'
      });
      g.appendChild(glow);
      state.glowEls[i] = glow;

      // Label radial cerca del borde, rotado para "salir" del centro.
      var lp = polar(CENTER, CENTER, LABEL_RADIUS, mid);
      var fontSize = n <= 6 ? 10 : (n <= 10 ? 8.5 : 7);
      var label = el('text', {
        'class': 'ruleta__wedge-label',
        x: lp.x.toFixed(2),
        y: lp.y.toFixed(2),
        'font-size': fontSize,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        // Rota el texto para que se lea desde el centro hacia afuera.
        transform: 'rotate(' + mid.toFixed(2) + ' ' + lp.x.toFixed(2) + ' ' + lp.y.toFixed(2) + ')'
      });
      label.textContent = truncate(items[i].label);
      g.appendChild(label);

      if (state.used[i]) g.classList.add('is-used');

      svg.appendChild(g);
      state.wedgeEls[i] = g;
    }

    // Remate: punto blanco en el extremo de cada division.
    for (var b = 0; b < n; b++) {
      var bp = polar(CENTER, CENTER, RADIUS - 3.5, b * sweep);
      svg.appendChild(el('circle', {
        'class': 'ruleta__spoke-dot',
        cx: bp.x.toFixed(2), cy: bp.y.toFixed(2), r: 2.4
      }));
    }

    root.appendChild(svg);

    // Hub central (no rota)
    var hub = document.createElement('div');
    hub.className = 'ruleta__hub';
    var logo = document.createElement('span');
    logo.className = 'ruleta__hub-logo';
    logo.textContent = 'N';
    hub.appendChild(logo);
    root.appendChild(hub);

    // Puntero superior (12 en punto)
    var pointer = document.createElement('div');
    pointer.className = 'ruleta__pointer';
    pointer.setAttribute('aria-hidden', 'true');
    root.appendChild(pointer);

    if (remaining() === 0 && n > 0) root.classList.add('is-empty');

    state.container.appendChild(root);
  }

  // ------------------------------------------------------------------------
  // Matemática del ángulo ganador  (CLAVE)
  // ------------------------------------------------------------------------
  //
  // El PUNTERO está ARRIBA, en las 12 en punto. En el sistema de coordenadas
  // SVG (0° = Este, ángulo crece en sentido horario porque Y crece hacia
  // abajo), las 12 en punto = -90° (equivalente a 270°).
  //
  // El sector i tiene su CENTRO angular en theta_i = i*sweep + sweep/2,
  // medido en el marco LOCAL del SVG (antes de aplicar la rotación de la
  // rueda). Tras rotar la rueda un ángulo R (grados, horario), ese centro
  // queda apuntando a:  theta_i + R.
  //
  // Queremos que el centro del sector ganador quede EXACTO bajo el puntero,
  // es decir:
  //        theta_i + R  ≡  POINTER_ANGLE   (mod 360)
  // con POINTER_ANGLE = -90 (las 12 en punto).
  //
  // Despejando la rotación objetivo (mod 360):
  //        R_target ≡ POINTER_ANGLE - theta_i   (mod 360)
  //
  // Como la rotación debe ser ACUMULATIVA y siempre hacia adelante, partimos
  // del ángulo actual `current`, sumamos K vueltas completas (K >= 4) y
  // ajustamos para aterrizar en una R cuyo residuo mod 360 sea R_target,
  // garantizando además que el delta total sea > 0.
  //
  var POINTER_ANGLE = -90; // 12 en punto en coords SVG

  function computeTargetRotation(current, winnerIndex, totalItems) {
    var sweep = 360 / totalItems;
    var thetaMid = winnerIndex * sweep + sweep / 2;

    // Residuo objetivo en [0,360)
    var targetMod = (((POINTER_ANGLE - thetaMid) % 360) + 360) % 360;

    // Residuo actual de la rotación acumulada en [0,360)
    var currentMod = ((current % 360) + 360) % 360;

    // Cuánto falta, hacia adelante, para alinear el residuo (en [0,360))
    var forward = (((targetMod - currentMod) % 360) + 360) % 360;

    // Vueltas completas: mínimo MIN_FULL_TURNS + extra aleatorio
    var fullTurns = MIN_FULL_TURNS + Math.floor(Math.random() * (EXTRA_RANDOM_TURNS + 1));

    // Delta total siempre positivo (acumulativo, nunca hacia atrás)
    var delta = fullTurns * 360 + forward;

    return current + delta;
  }

  // ------------------------------------------------------------------------
  // API pública
  // ------------------------------------------------------------------------

  function mount(containerEl, items) {
    if (!containerEl) throw new Error('RuletaWheel.mount: containerEl requerido');
    if (!Array.isArray(items)) throw new Error('RuletaWheel.mount: items debe ser un array');

    state.container = containerEl;
    // Copia defensiva (inmutabilidad de la entrada)
    state.items = items.map(function (it) {
      return { label: it && it.label, color: (it && it.color) || '#888888' };
    });
    state.used = state.items.map(function () { return false; });
    state.rotation = 0;
    state.spinning = false;
    state.reduceMotion = (typeof global.matchMedia === 'function') &&
      global.matchMedia('(prefers-reduced-motion: reduce)').matches;

    render();
    return state.items.length;
  }

  function remaining() {
    return state.used.reduce(function (acc, u) { return acc + (u ? 0 : 1); }, 0);
  }

  function total() {
    return state.items.length;
  }

  function reset() {
    state.used = state.items.map(function () { return false; });
    state.rotation = 0;
    state.spinning = false;
    render();
  }

  function pickRandomUnused() {
    var pool = [];
    for (var i = 0; i < state.used.length; i++) {
      if (!state.used[i]) pool.push(i);
    }
    if (pool.length === 0) return -1;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function markUsedAndGlow(index) {
    state.used[index] = true;
    var g = state.wedgeEls[index];
    if (g) g.classList.add('is-used');

    var glow = state.glowEls[index];
    if (glow && !state.reduceMotion) {
      // Reinicia la animación de glow
      glow.classList.remove('is-firing');
      // Forzar reflow para reiniciar la animación CSS
      void glow.getBoundingClientRect();
      glow.classList.add('is-firing');
    }
    if (remaining() === 0 && state.rootEl) state.rootEl.classList.add('is-empty');
  }

  function spin() {
    return new Promise(function (resolve) {
      if (state.spinning) { resolve(-1); return; }

      var winner = pickRandomUnused();
      if (winner < 0) { resolve(-1); return; }

      var target = computeTargetRotation(state.rotation, winner, state.items.length);

      // --- Reduced motion: aterriza instantáneo, marca usado, resuelve ----
      if (state.reduceMotion) {
        state.rotation = target;
        state.svg.style.transition = 'none';
        state.svg.style.transform = 'rotate(' + target + 'deg)';
        markUsedAndGlow(winner);
        resolve(winner);
        return;
      }

      // --- Animación normal ----------------------------------------------
      state.spinning = true;
      var svg = state.svg;

      var onEnd = function () {
        svg.removeEventListener('transitionend', onEnd);
        svg.classList.remove('is-spinning');
        state.rotation = target;       // persistir ángulo acumulado
        state.spinning = false;
        markUsedAndGlow(winner);
        resolve(winner);
      };
      svg.addEventListener('transitionend', onEnd);

      // Aplica la transición vía clase (duración/easing en CSS) y dispara.
      svg.classList.add('is-spinning');
      // Doble rAF para asegurar que el navegador registre el estado inicial
      // antes de cambiar el transform (de lo contrario no anima).
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          svg.style.transform = 'rotate(' + target + 'deg)';
        });
      });

      // Red de seguridad: si transitionend no dispara (tab oculta, etc.)
      setTimeout(function () {
        if (state.spinning) onEnd();
      }, SPIN_DURATION_MS + 250);
    });
  }

  global.RuletaWheel = {
    mount: mount,
    spin: spin,
    remaining: remaining,
    total: total,
    reset: reset,
    // expuesto para pruebas unitarias del cálculo de ángulo
    _computeTargetRotation: computeTargetRotation
  };

})(typeof window !== 'undefined' ? window : this);

/* ============================================================================
   AUTO-TEST / USO (bloque no ejecutable, solo documentación)
   ----------------------------------------------------------------------------
   // 1) Montar la ruleta en un contenedor:
   // RuletaWheel.mount(el, [
   //   {label:'Bogotá',   color:'#2c5f9b'},
   //   {label:'Medellín', color:'#1f8923'},
   //   {label:'Cali',     color:'#d74009'},
   //   {label:'Barranquilla', color:'#7c3aed'}
   // ]);
   //
   // 2) Botón de la PÁGINA consumidora (el botón NO vive dentro del componente):
   // btn.onclick = async () => {
   //   const i = await RuletaWheel.spin();
   //   if (i >= 0) asignar(items[i]);   // i = índice ganador en `items`
   //   else        console.log('No quedan sectores');
   // };
   //
   // 3) Verificación de la matemática del puntero (12 en punto = -90°):
   //    Tras el spin, el centro del sector i (theta_i = i*sweep + sweep/2)
   //    cumple:  (rotationFinal + theta_i) mod 360 === 270  (= -90 mod 360).
   //    p.ej. n=4 => sweep=90. winner=0 => theta_0=45.
   //          R_target mod 360 = (-90 - 45) mod 360 = 225.  (225+45=270 ✓)
   //
   // 4) reset() limpia usados; remaining()/total() reportan progreso.
   ============================================================================ */
