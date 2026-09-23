/* ═══════════════════════════════════════════════════════════════
   SORTEO ENGINE — lógica pura del sorteo (F2)
   ───────────────────────────────────────────────────────────────
   Produce EXACTAMENTE la data-shape `comp` que ya consumen los
   renderers de detalle.html / competition-render.js:

     comp.grupos = [{ nombre, equipos[], partidos[{id,jornada,t1,t2,
                      s1,s2,status}], tabla[{equipo,pj,pg,pp,pts}] }]
     comp.bracket = [{ round, matches[{id,t1,t2,s1,s2,status,medal}] }]
     comp.sisCls = 'grupos' | 'robin' | 'elim' | 'final'
     comp.medal  = bool

   Funciones puras → mismas para ruleta y transcripción. Sin DOM.
   Expone window.SorteoEngine.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  const BYE = 'Descansa';

  /** Fisher-Yates in-place */
  function _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /** Índice de grupo fijo de un participante (regla del sorteo), o -1 si libre.
   *  Acepta p.grupoFijo como número (0-based) o letra ('A'→0). Fuera de rango → -1. */
  function fixedGroupIndex(p, nGrupos) {
    if (!p || typeof p !== 'object') return -1;
    let gi = p.grupoFijo;
    if (gi == null || gi === '') return -1;
    if (typeof gi === 'string') {
      const s = gi.trim(); if (!s) return -1;
      gi = s.length === 1 && /[a-zA-Z]/.test(s) ? (s.toUpperCase().charCodeAt(0) - 65) : parseInt(s, 10);
    }
    if (typeof gi !== 'number' || !Number.isFinite(gi)) return -1; // NaN/obj/array/bool → libre
    gi = gi | 0;
    return (gi >= 0 && gi < Math.max(1, nGrupos | 0)) ? gi : -1;
  }

  /** Reparte N participantes en M grupos, con soporte de REGLAS (grupoFijo por equipo)
   *  y sorteo real opcional (opts.shuffle). Sin opts ni reglas se comporta igual que
   *  antes (bloques secuenciales 1-4→A, 5-8→B…). Los equipos con grupoFijo se colocan
   *  primero en su grupo (respetando capacidad); el resto llena los cupos restantes
   *  (barajados si opts.shuffle). Devuelve [[...gA],[...gB], …] (solo equipos reales). */
  function asignarGrupos(participantes, nGrupos, opts) {
    opts = opts || {};
    const m = Math.max(1, nGrupos | 0);
    const items = (participantes || []).map((p) => (typeof p === 'string' ? { nombre: p } : (p || {})));
    const n = items.length;
    const base = Math.floor(n / m);
    const extra = n % m; // primeros `extra` grupos reciben uno más
    const sizes = [];
    for (let g = 0; g < m; g++) sizes.push(base + (g < extra ? 1 : 0));
    const groups = [];
    for (let g = 0; g < m; g++) groups.push([]);
    // 1) colocar equipos FIJADOS por regla (si caben en su grupo)
    const free = [];
    items.forEach((it) => {
      const gi = fixedGroupIndex(it, m);
      if (gi >= 0 && groups[gi].length < sizes[gi]) groups[gi].push(it.nombre);
      else free.push(it.nombre); // libre, o grupo fijado ya lleno (overflow → se reparte)
    });
    // 2) barajar libres para un sorteo real (opcional)
    if (opts.shuffle) _shuffle(free);
    // 3) rellenar cupos restantes grupo por grupo
    let fi = 0;
    for (let g = 0; g < m; g++) {
      while (groups[g].length < sizes[g] && fi < free.length) groups[g].push(free[fi++]);
    }
    // 4) red de seguridad: si quedara sobrante (invariante de tamaños roto), repartir
    //    al grupo más pequeño en cada paso para no desbalancear ni volcarlo todo al último.
    while (fi < free.length) {
      let g = 0;
      for (let k = 1; k < m; k++) if (groups[k].length < groups[g].length) g = k;
      groups[g].push(free[fi++]);
    }
    return groups;
  }

  /** Round-robin método del círculo: N-1 jornadas, cada par una vez.
   *  Si N impar agrega un equipo fantasma `Descansa` y rota el bye.
   *  Devuelve partidos[{jornada,t1,t2,s1,s2,status}] (status 'bye'
   *  cuando el rival es Descansa). */
  function roundRobin(equipos) {
    const teams = equipos.slice();
    if (teams.length % 2 !== 0) teams.push(BYE);
    const n = teams.length;
    const rounds = n - 1;
    const half = n / 2;
    const partidos = [];
    let arr = teams.slice();
    for (let r = 0; r < rounds; r++) {
      for (let i = 0; i < half; i++) {
        const t1 = arr[i];
        const t2 = arr[n - 1 - i];
        const isBye = t1 === BYE || t2 === BYE;
        partidos.push({
          jornada: r + 1,
          t1: isBye && t1 === BYE ? t2 : t1,
          t2: isBye && t1 === BYE ? t1 : t2,
          s1: null,
          s2: null,
          status: isBye ? 'bye' : 'pending',
        });
      }
      // rotación del círculo: fijo arr[0], los demás giran una posición
      arr = [arr[0], arr[n - 1]].concat(arr.slice(1, n - 1));
    }
    return partidos;
  }

  /** Recalcula la tabla desde los partidos jugados (status 'done').
   *  Victoria 3 pts, empate 1, derrota 0. Ordena por pts, luego pg.
   *  En un sorteo recién generado todos los partidos están pending →
   *  tabla en 0 con el orden de siembra del grupo. */
  function recalcStandings(grupo) {
    const stats = {};
    grupo.equipos.forEach((e) => {
      if (e !== BYE) stats[e] = { equipo: e, pj: 0, pg: 0, pp: 0, pts: 0 };
    });
    grupo.partidos.forEach((m) => {
      if (m.status !== 'done' || m.t1 === BYE || m.t2 === BYE) return;
      if (!stats[m.t1] || !stats[m.t2]) return;
      stats[m.t1].pj++;
      stats[m.t2].pj++;
      if (m.s1 > m.s2) {
        stats[m.t1].pg++; stats[m.t1].pts += 3; stats[m.t2].pp++;
      } else if (m.s2 > m.s1) {
        stats[m.t2].pg++; stats[m.t2].pts += 3; stats[m.t1].pp++;
      } else {
        stats[m.t1].pts++; stats[m.t2].pts++;
      }
    });
    return Object.values(stats).sort((a, b) => b.pts - a.pts || b.pg - a.pg);
  }

  /** Fase final cruzada (medallas) para 2 grupos:
   *   Final         → 1ºA vs 1ºB  (oro / plata)
   *   Tercer puesto → 2ºA vs 2ºB  (bronce / 4º)
   *  En el sorteo los clasificados aún no están decididos → usa
   *  semillas placeholder ("1° Grupo A"). Devuelve comp.bracket. */
  function faseFinal(grupos) {
    if (!grupos || grupos.length < 2) return null;
    const A = grupos[0];
    const B = grupos[1];
    const seed = (grupo, pos) => `${pos + 1}° ${grupo.nombre}`;
    return [
      {
        round: 'Final',
        matches: [
          { id: 'FIN', t1: seed(A, 0), t2: seed(B, 0), s1: null, s2: null, status: 'pending', medal: 'oro', seeded: true },
        ],
      },
      {
        round: 'Tercer puesto',
        matches: [
          { id: 'TER', t1: seed(A, 1), t2: seed(B, 1), s1: null, s2: null, status: 'pending', medal: 'bronce', seeded: true },
        ],
      },
    ];
  }

  /** Ensambla el objeto `comp` final a partir del estado del sorteo.
   *  sorteo = { prueba:{deporteLabel,emoji,categoria,sexo,tipo},
   *             config:{nGrupos}, participantes:[{nombre,...}] } */
  function toComp(sorteo) {
    const cfg = sorteo.config || {};
    const nGrupos = Math.max(1, (cfg.nGrupos | 0) || 1);
    const reparto = (sorteo.manualGroups && sorteo.manualGroups.length)
      ? sorteo.manualGroups
      : asignarGrupos(sorteo.participantes || [], nGrupos);

    const grupos = reparto.map((teams, i) => {
      const grupo = {
        nombre: 'Grupo ' + String.fromCharCode(65 + i),
        equipos: teams.slice(),
        partidos: roundRobin(teams).map((p, j) => ({ ...p, id: i * 100 + j })),
      };
      grupo.tabla = recalcStandings(grupo);
      return grupo;
    });

    const bracket = nGrupos >= 2 ? faseFinal(grupos) : null;
    const pr = sorteo.prueba || {};

    return {
      sisCls: 'grupos',
      sistema: nGrupos >= 2 ? 'Fase de Grupos + Final' : 'Round Robin',
      nombre: [pr.deporteLabel, pr.categoria, pr.sexo].filter(Boolean).join(' '),
      deporte: pr.deporteLabel || '',
      emoji: pr.emoji || '🏆',
      categoria: pr.categoria || '',
      genero: pr.sexo || '',
      grupos,
      bracket,
      medal: !!bracket,
      jornadasCount: grupos.length ? Math.max(...grupos.map((g) => g.partidos.reduce((mx, p) => Math.max(mx, p.jornada), 0))) : 0,
    };
  }

  /* ═══════════════════════════════════════════════════════════════
     F4 — BRACKET de eliminación directa (transcripción manual)
     ─────────────────────────────────────────────────────────────── */

  /** Orden de siembra estándar de un cuadro de tamaño potencia de 2.
   *  Devuelve los números de semilla (1..size) en orden de slots, de
   *  forma que las semillas altas se cruzan tarde (1 vs size, 2 al lado
   *  opuesto, etc.). Ej. size 4 → [1,4,2,3]; size 8 → [1,8,4,5,2,7,3,6]. */
  function seedOrder(size) {
    let pls = [1, 2];
    while (pls.length < size) {
      const out = [];
      const sum = pls.length * 2 + 1;
      for (let i = 0; i < pls.length; i++) { out.push(pls[i]); out.push(sum - pls[i]); }
      pls = out;
    }
    return pls;
  }

  /** Nombres de ronda terminando en 'Final' (etiquetas que reconoce
   *  scoring-modal.js para fase eliminatoria). */
  function _roundNames(mainRounds) {
    const map = {
      1: ['Final'],
      2: ['Semifinal', 'Final'],
      3: ['Cuartos', 'Semifinal', 'Final'],
      4: ['Octavos', 'Cuartos', 'Semifinal', 'Final'],
      5: ['Dieciseisavos', 'Octavos', 'Cuartos', 'Semifinal', 'Final'],
      6: ['Treintaidosavos', 'Dieciseisavos', 'Octavos', 'Cuartos', 'Semifinal', 'Final'],
    };
    if (map[mainRounds]) return map[mainRounds];
    const a = [];
    for (let i = 0; i < mainRounds - 1; i++) a.push('Ronda ' + (i + 1));
    a.push('Final');
    return a;
  }

  function _findMatch(bracket, id) {
    for (let r = 0; r < bracket.length; r++) {
      const ms = bracket[r].matches;
      for (let m = 0; m < ms.length; m++) if (ms[m].id === id) return ms[m];
    }
    return null;
  }

  /** Construye un cuadro de eliminación directa para N participantes.
   *  Calcula la potencia de 2 superior, reparte BYEs a las semillas
   *  altas, nombra las rondas, fija punteros de avance (ganador → match
   *  padre; perdedor de semifinal → Tercer puesto) y auto-resuelve los
   *  BYEs de 1ª ronda. participantes = [nombre | {nombre}].
   *  opts.tercerPuesto (default true para >=4). */
  function buildBracketFromSeeds(participantes, opts) {
    opts = opts || {};
    const names = (participantes || [])
      .map((p) => (typeof p === 'string' ? p : (p && p.nombre) || ''))
      .filter((x) => x);
    const n = names.length;
    if (n < 2) return [];
    const tercer = opts.tercerPuesto !== false && n >= 4;
    let size = 1; while (size < n) size *= 2;
    const mainRounds = Math.round(Math.log2(size));
    const rnames = _roundNames(mainRounds);
    const order = seedOrder(size);
    const seedTeam = (seed) => (seed <= n ? names[seed - 1] : null); // null = BYE

    const rounds = [];
    for (let r = 0; r < mainRounds; r++) {
      const cnt = size / Math.pow(2, r + 1);
      const matches = [];
      for (let m = 0; m < cnt; m++) {
        matches.push({ id: 'R' + r + 'M' + m, t1: null, t2: null, s1: null, s2: null, status: 'pending' });
      }
      rounds.push({ round: rnames[r], matches });
    }
    // punteros de avance del ganador
    for (let r = 0; r < mainRounds - 1; r++) {
      rounds[r].matches.forEach((mt, m) => {
        mt.next = { id: rounds[r + 1].matches[Math.floor(m / 2)].id, slot: m % 2 === 0 ? 1 : 2 };
      });
    }
    // siembra de 1ª ronda
    rounds[0].matches.forEach((mt, m) => { mt.t1 = seedTeam(order[m * 2]); mt.t2 = seedTeam(order[m * 2 + 1]); });

    let tercerRound = null;
    if (tercer && mainRounds >= 2) {
      tercerRound = { round: 'Tercer puesto', matches: [{ id: 'R3P', t1: null, t2: null, s1: null, s2: null, status: 'pending', medal: 'bronce' }] };
      const semiIdx = mainRounds - 2;
      rounds[semiIdx].matches.forEach((mt, m) => { mt.loserNext = { id: 'R3P', slot: m % 2 === 0 ? 1 : 2 }; });
    }
    rounds[mainRounds - 1].matches[0].medal = 'oro';

    const bracket = rounds.slice();
    if (tercerRound) bracket.push(tercerRound);

    // auto-resuelve BYEs de 1ª ronda (un competidor presente → avanza)
    rounds[0].matches.forEach((mt) => {
      const hasT1 = !!mt.t1, hasT2 = !!mt.t2;
      if (hasT1 === hasT2) return; // partido real (ambos) o vacío (ninguno)
      const winName = hasT1 ? mt.t1 : mt.t2;
      mt.status = 'bye';
      mt.winner = hasT1 ? 1 : 2;
      if (mt.next) {
        const nm = _findMatch(bracket, mt.next.id);
        if (nm) { if (mt.next.slot === 1) nm.t1 = winName; else nm.t2 = winName; }
      }
    });
    return bracket;
  }

  /** Marca el ganador de un match (winner 1|2 + status done + score
   *  opcional) y propaga: ganador → slot del match padre; perdedor de
   *  semifinal → Tercer puesto. Inmutable: devuelve un comp nuevo. */
  function advanceWinner(comp, matchId, winner, score) {
    if (!comp || !comp.bracket) return comp;
    const c = JSON.parse(JSON.stringify(comp));
    const mt = _findMatch(c.bracket, matchId);
    if (!mt || !mt.t1 || !mt.t2) return comp; // no se puede decidir un match incompleto
    if (score && (score.s1 != null || score.s2 != null)) { mt.s1 = score.s1; mt.s2 = score.s2; }
    mt.winner = winner;
    mt.status = 'done';
    const winName = winner === 1 ? mt.t1 : mt.t2;
    const loseName = winner === 1 ? mt.t2 : mt.t1;
    if (mt.next) {
      const nm = _findMatch(c.bracket, mt.next.id);
      if (nm) { if (mt.next.slot === 1) nm.t1 = winName; else nm.t2 = winName; }
    }
    if (mt.loserNext) {
      const lm = _findMatch(c.bracket, mt.loserNext.id);
      if (lm) { if (mt.loserNext.slot === 1) lm.t1 = loseName; else lm.t2 = loseName; }
    }
    return c;
  }

  /** Ensambla un comp 'solo bracket' (sisCls 'elim') desde el sorteo,
   *  hermano de toComp para no inflarlo. Las semillas = orden de
   *  participantes (clasificados). */
  function toCompBracket(sorteo) {
    const pr = sorteo.prueba || {};
    const parts = (sorteo.participantes || [])
      .map((p) => (typeof p === 'string' ? p : (p && p.nombre) || ''))
      .filter(Boolean);
    const bracket = buildBracketFromSeeds(parts, { tercerPuesto: parts.length >= 4 });
    return {
      sisCls: 'elim',
      sistema: 'Eliminación directa',
      nombre: [pr.deporteLabel, pr.categoria, pr.sexo].filter(Boolean).join(' '),
      deporte: pr.deporteLabel || '',
      emoji: pr.emoji || '🏆',
      categoria: pr.categoria || '',
      genero: pr.sexo || '',
      grupos: [],
      bracket,
      medal: true,
      jornadasCount: 0,
    };
  }

  global.SorteoEngine = { BYE, asignarGrupos, fixedGroupIndex, roundRobin, recalcStandings, faseFinal, toComp, seedOrder, buildBracketFromSeeds, advanceWinner, toCompBracket };
})(typeof window !== 'undefined' ? window : globalThis);
