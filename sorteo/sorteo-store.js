/* ═══════════════════════════════════════════════════════════════
   SORTEO STORE — persistencia local de sorteos (F5/F3b)
   ───────────────────────────────────────────────────────────────
   Patrón escenarios-store (#4) + reset por barrido de prefijo (#23).
   Guarda el resultado confirmado de un sorteo por prueba, para
   poblar la pestaña "Resultados" del evento y la vista pública.

   Registro:
     { id, prueba:{deporteLabel,emoji,categoria,sexo,tipo},
       comp, estado:'PUBLICADO'|'ANULADO', origen, ts,
       anuladoTs?, motivo? }

   Clave localStorage: `naowee-sorteo-<id>`. Sin dependencias.
   Expone window.SorteoStore.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var PREFIX = 'naowee-sorteo-';

  function key(id) { return PREFIX + id; }

  /** Id estable derivado de la prueba (deporte+categoría+sexo), de
   *  modo que reconfirmar la misma prueba ACTUALICE su registro. */
  function pruebaId(src) {
    var pr = (src && src.prueba) ? src.prueba : src || {};
    var parts = [pr.deporteLabel || pr.deporte, pr.categoria, pr.sexo]
      .filter(Boolean)
      .join('-')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '') // sin acentos
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return parts || 'sorteo';
  }

  function save(record) {
    if (!record || !record.id) return null;
    try { localStorage.setItem(key(record.id), JSON.stringify(record)); } catch (e) {}
    return record;
  }

  function get(id) {
    try { return JSON.parse(localStorage.getItem(key(id)) || 'null'); } catch (e) { return null; }
  }

  /** Todos los sorteos guardados, más recientes primero. */
  function list() {
    var out = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf(PREFIX) === 0) {
        try { var r = JSON.parse(localStorage.getItem(k)); if (r) out.push(r); } catch (e) {}
      }
    }
    return out.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
  }

  function remove(id) { try { localStorage.removeItem(key(id)); } catch (e) {} }

  /** Anula un sorteo confirmado (queda en historial con motivo). */
  function anular(id, motivo) {
    var r = get(id);
    if (!r) return null;
    r.estado = 'ANULADO';
    r.anuladoTs = Date.now();
    if (motivo) r.motivo = motivo;
    return save(r);
  }

  /** Reset de demo: barre TODA clave con el prefijo (sessionStorage
   *  + localStorage), recorriendo al revés para no saltar índices. */
  function resetAll() {
    [global.localStorage, global.sessionStorage].forEach(function (store) {
      if (!store) return;
      for (var i = store.length - 1; i >= 0; i--) {
        var k = store.key(i);
        if (k && k.indexOf(PREFIX) === 0) store.removeItem(k);
      }
    });
  }

  global.SorteoStore = { PREFIX: PREFIX, pruebaId: pruebaId, save: save, get: get, list: list, remove: remove, anular: anular, resetAll: resetAll };
})(typeof window !== 'undefined' ? window : globalThis);
