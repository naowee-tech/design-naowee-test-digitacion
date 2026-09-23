/* ═══════════════════════════════════════════════════════════
   competition-render.js  →  window.CompRender
   Renderizadores READ-ONLY (solo preview/consulta) de un objeto
   `comp` producido por sorteo-engine.js. Portado fielmente de
   detalle.html ELIMINANDO toda interactividad (registrar/digitar/
   tabs/onclick). Funciones puras que devuelven strings, excepto
   renderComp() que escribe en el DOM.

   Sin dependencias de variables globales de detalle.html: todo se
   recibe por parámetro. Requiere competition-render.css cargado.

   data-shape esperada (resumida):
   comp = {
     sisCls, sistema, nombre, deporte, emoji, categoria, genero, medal,
     grupos:[ { nombre, equipos:[], partidos:[{id,jornada,t1,t2,s1,s2,status}], tabla:[{equipo,pj,pg,pp,pts}] } ],
     bracket:[ { round, matches:[{id,t1,t2,s1,s2,status,medal}] } ]
   }
   status de partido: 'pending' | 'done' | 'bye' (bye → t2 'Descansa')
═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  /* Paleta de avatares — portada verbatim de detalle.html */
  var TEAM_COLORS = ['#2c5f9b','#e67e22','#9b59b6','#1f8923','#e74c3c','#3498db','#f39c12','#1abc9c','#e91e63','#00bcd4'];

  /* teamColor(name) — hash determinista → color (verbatim) */
  function teamColor(name){
    name = name || '';
    var h = 0;
    for(var i=0;i<name.length;i++) h = name.charCodeAt(i)+((h<<5)-h);
    return TEAM_COLORS[Math.abs(h)%TEAM_COLORS.length];
  }

  /* teamInit(name) — iniciales del equipo (verbatim) */
  function teamInit(name){
    name = name || '';
    return name.split(' ').filter(function(w){return w.length>1;})
      .map(function(w){return w[0];}).join('').substring(0,2).toUpperCase() || (name[0]||'?');
  }

  /* Escapa texto para insertarlo en HTML (seguridad — no había en detalle.html
     porque la data era estática; aquí blindamos por si llegan nombres dinámicos) */
  function esc(s){
    return String(s==null?'':s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  /* ¿Es un nombre placeholder tipo "1° Grupo A" / "Por definir"? */
  function isPlaceholder(name){
    if(!name) return true;
    return /^\s*\d+\s*[°ºoO]\s+/.test(name) || /por definir/i.test(name);
  }

  /* Metadato del equipo (dos tonos): nombre = institución arriba,
     comp.teamMeta[name] = "Región · Municipio" abajo (en gris). Si no
     hay meta → sin subtexto (NUNCA repetir el nombre). Feedback Danna. */
  function _teamMeta(comp, name){ return (comp && comp.teamMeta && comp.teamMeta[name]) || ''; }
  function _subLine(cls, comp, name){
    var meta = _teamMeta(comp, name);
    return meta ? '<div class="'+cls+'">'+esc(meta)+'</div>' : '';
  }

  /* ───────────────────────────────────────────────
     renderStandings(grupo) → htmlString
     Tabla de posiciones de un grupo (clases .standings-*).
     Portado de renderGruposView/renderPosiciones.
  ─────────────────────────────────────────────── */
  function renderStandings(grupo){
    if(!grupo || !grupo.tabla || !grupo.tabla.length){
      return '<div class="cr-empty">Sin tabla de posiciones.</div>';
    }
    var html = '<div class="cr-stand-card"><div class="cr-stand-head"><span class="cr-stand-dot"></span>'+esc(grupo.nombre)+'</div>';
    html += '<table class="standings-table"><thead><tr><th>Pos</th><th>Equipo</th><th>PJ</th><th>PG</th><th>PP</th><th>Pts</th></tr></thead><tbody>';
    grupo.tabla.forEach(function(t,i){
      /* Podio: 1 oro, 2 plata, 3 ocre, 4+ gris. Antes eran solo tres tramos
         (1 naranja de marca, 2 azul, 3+ gris), que no leia como podio. */
      var posCls = i===0?'pos1':i===1?'pos2':i===2?'pos3':'pos4';
      html += '<tr>'
        + '<td><span class="standings-pos '+posCls+'">'+(i+1)+'</span></td>'
        + '<td><div class="standings-team"><div class="team-avatar" style="background:'+teamColor(t.equipo)+';color:#fff;width:28px;height:28px;font-size:10px">'+esc(teamInit(t.equipo))+'</div><div><div class="standings-team-name">'+esc(t.equipo)+'</div></div></div></td>'
        + '<td>'+esc(t.pj)+'</td><td>'+esc(t.pg)+'</td><td>'+esc(t.pp)+'</td><td class="standings-pts">'+esc(t.pts)+'</td>'
        + '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  /* Una match-card READ-ONLY (sin botón Digitar). Maneja bye. */
  function _matchCard(m, comp){
    /* bye → t2 'Descansa' */
    var isBye = m.status==='bye' || /descansa/i.test(m.t2||'');
    if(isBye){
      var c = teamColor(m.t1);
      return '<div class="cr-bye-card">'
        + '<div class="team-avatar" style="background:'+c+';color:#fff">'+esc(teamInit(m.t1))+'</div>'
        + '<div class="cr-bye-text"><strong>'+esc(m.t1)+'</strong> &middot; Descansa</div>'
        + '</div>';
    }
    var c1 = teamColor(m.t1), c2 = teamColor(m.t2);
    var center = m.status==='done'
      ? '<div class="match-score">'+esc(m.s1)+' - '+esc(m.s2)+'</div>'
      : '<div class="match-vs">VS</div>';
    var statusTxt = m.status==='done' ? 'Finalizado' : 'Pendiente';
    return '<div class="match-card">'
      + '<div class="match-team"><div class="team-avatar" style="background:'+c1+';color:#fff">'+esc(teamInit(m.t1))+'</div><div><div class="team-name">'+esc(m.t1)+'</div>'+_subLine('team-sub',comp,m.t1)+'</div></div>'
      + '<div class="match-center">'+center+'<div class="match-status">'+statusTxt+'</div></div>'
      + '<div class="match-team right"><div><div class="team-name">'+esc(m.t2)+'</div>'+_subLine('team-sub',comp,m.t2)+'</div><div class="team-avatar" style="background:'+c2+';color:#fff">'+esc(teamInit(m.t2))+'</div></div>'
      + '</div>';
  }

  /* ───────────────────────────────────────────────
     renderGrupos(comp) → htmlString
     Por cada grupo: nombre + roster + partidos agrupados por
     jornada (byes marcados "Descansa") + tabla de posiciones.
     READ-ONLY.
  ─────────────────────────────────────────────── */
  function renderGrupos(comp){
    if(!comp || !comp.grupos || !comp.grupos.length){
      return '<div class="cr-empty">Esta competencia no tiene fase de grupos.</div>';
    }
    var html = '';
    comp.grupos.forEach(function(g){
      html += '<div class="cr-group">';
      html += '<h3 class="cr-group-name">'+esc(g.nombre)+'</h3>';

      /* Roster */
      var equipos = g.equipos || [];
      if(equipos.length){
        html += '<div class="cr-roster">';
        equipos.forEach(function(eq){
          html += '<span class="cr-roster-chip"><span class="team-avatar" style="background:'+teamColor(eq)+';color:#fff">'+esc(teamInit(eq))+'</span>'+esc(eq)+'</span>';
        });
        html += '</div>';
      }

      /* Partidos agrupados por jornada */
      var partidos = g.partidos || [];
      var jornadas = [];
      partidos.forEach(function(p){ if(jornadas.indexOf(p.jornada)===-1) jornadas.push(p.jornada); });

      if(jornadas.length){
        jornadas.forEach(function(j){
          html += '<div class="cr-jornada-label">Jornada '+esc(j)+'</div>';
          partidos.filter(function(p){return p.jornada===j;}).forEach(function(m){
            html += _matchCard(m, comp);
          });
        });
      } else if(partidos.length){
        /* Sin metadato de jornada → lista plana */
        partidos.forEach(function(m){ html += _matchCard(m, comp); });
      }

      html += '</div>';
    });
    return html;
  }

  /* Nodo de bracket READ-ONLY (sin onclick / registrar).
     Portado de _renderBracketNode eliminando la barra "Registrar". */
  function _renderBracketNode(m, isTercer, roundName, comp){
    var cls = m.status==='done'?'finalizado':m.status==='pending'?'pending':'';
    var tercerCls = isTercer?'tercer-puesto':'';
    var isDone = m.status==='done';
    var t1IsWinner = isDone && m.winner===1;
    var t2IsWinner = isDone && m.winner===2;
    var t1Won = t1IsWinner || (isDone && m.s1!=null && m.s2!=null && m.s1>m.s2);
    var t2Won = t2IsWinner || (isDone && m.s1!=null && m.s2!=null && m.s2>m.s1);

    var rn = (roundName||'').toUpperCase();
    var isFinal = rn === 'FINAL';
    function _winEmoji(won){ return isTercer ? '🥉' : (isFinal && !won ? '🥈' : '🏆'); }

    var h = '<div class="bracket-node '+cls+' '+tercerCls+'">';

    /* Team 1 */
    if(m.t1){
      var rowCls1 = isDone ? (t1Won ? 'winner' : 'loser') : '';
      var c1 = teamColor(m.t1);
      var t1Emoji = isDone && isFinal ? (t1Won ? '🏆' : '🥈') : (t1Won ? _winEmoji(true) : '');
      h += '<div class="bracket-team-row '+rowCls1+'">'
        + '<div class="bracket-initial" '+(!isDone?'style="background:'+c1+';color:#fff"':'')+'>'+esc(teamInit(m.t1))+'</div>'
        + '<div class="bracket-tname-wrap"><div class="bracket-tname">'+esc(m.t1)+'</div>'+_subLine('bracket-tsub',comp,m.t1)+'</div>'
        + '<div class="bracket-score-wrap">'
        + (t1Emoji?'<span class="bracket-trophy">'+t1Emoji+'</span>':'')
        + '<span class="bracket-score '+(m.s1==null?'pending-score':'')+'">'+(m.s1!=null?esc(m.s1):'-')+'</span>'
        + '</div></div>';
    }

    /* Team 2 */
    if(m.t2){
      var rowCls2 = isDone ? (t2Won ? 'winner' : 'loser') : '';
      var c2 = teamColor(m.t2);
      var t2Emoji = isDone && isFinal ? (t2Won ? '🏆' : '🥈') : (t2Won ? _winEmoji(true) : '');
      h += '<div class="bracket-team-row '+rowCls2+'">'
        + '<div class="bracket-initial" '+(!isDone?'style="background:'+c2+';color:#fff"':'')+'>'+esc(teamInit(m.t2))+'</div>'
        + '<div class="bracket-tname-wrap"><div class="bracket-tname">'+esc(m.t2)+'</div>'+_subLine('bracket-tsub',comp,m.t2)+'</div>'
        + '<div class="bracket-score-wrap">'
        + (t2Emoji?'<span class="bracket-trophy">'+t2Emoji+'</span>':'')
        + '<span class="bracket-score '+(m.s2==null?'pending-score':'')+'">'+(m.s2!=null?esc(m.s2):'-')+'</span>'
        + '</div></div>';
    } else if(!m.t2 && m.status==='pending'){
      h += '<div class="bracket-team-row">'
        + '<div class="bracket-initial" style="background:#e8e9ee;color:var(--text-secondary)">?</div>'
        + '<div class="bracket-tname-wrap"><div class="bracket-tname" style="color:var(--text-secondary)">Por definir</div></div>'
        + '<span class="bracket-score pending-score">-</span>'
        + '</div>';
    }

    /* Barra de estado — READ-ONLY (sin "Registrar resultado") */
    if(isDone){
      h += '<div class="bracket-status done"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Finalizado</div>';
    } else if(m.status==='in-progress'){
      h += '<div class="bracket-status en-curso">En curso</div>';
    } else if(m.status==='pending'){
      h += '<div class="bracket-status">Pendiente</div>';
    }

    h += '</div>';
    return h;
  }

  /* ───────────────────────────────────────────────
     renderBracket(comp) → htmlString
     Fase final: Final + Tercer puesto (clases .bracket-*).
     Layout simple de columnas/nodos (sin conectores SVG, que en
     detalle.html dependen de medición del DOM post-render).
     READ-ONLY.
  ─────────────────────────────────────────────── */
  function renderBracket(comp){
    if(!comp || !comp.bracket || !comp.bracket.length){
      return '<div class="cr-empty">Sin fase de eliminación.</div>';
    }
    /* Normaliza: separa "Tercer puesto" del flujo principal */
    var mainRounds = comp.bracket.filter(function(r){ return !/tercer puesto/i.test(r.round||''); });
    var tercerRound = comp.bracket.filter(function(r){ return /tercer puesto/i.test(r.round||''); })[0];

    var html = '<div class="bracket-header"><h3>Cuadro de eliminación</h3></div>';

    /* Títulos de columna */
    html += '<div class="bracket-scroll"><div class="bracket-titles">';
    mainRounds.forEach(function(round,ri){
      if(ri>0) html += '<div class="bracket-svg-spacer"></div>';
      html += '<div class="bracket-col-title">'+esc(round.round)+'</div>';
    });
    if(tercerRound) html += '<div class="bracket-svg-spacer"></div><div class="bracket-col-title">Tercer puesto</div>';
    html += '</div>';

    /* Nodos */
    html += '<div class="bracket-wrap">';
    mainRounds.forEach(function(round,ri){
      if(ri>0) html += '<div class="bracket-svg-col"></div>';
      html += '<div class="bracket-col">';
      (round.matches||[]).forEach(function(m){ html += _renderBracketNode(m, false, round.round, comp); });
      html += '</div>';
    });
    if(tercerRound){
      html += '<div class="bracket-svg-col"></div><div class="bracket-col">';
      (tercerRound.matches||[]).forEach(function(m){ html += _renderBracketNode(m, true, tercerRound.round, comp); });
      html += '</div>';
    }
    html += '</div></div>';
    return html;
  }

  /* Resuelve los podios a partir del bracket.
     Devuelve {oro,plata,bronce,cuarto} con strings o null. */
  function _resolvePodium(comp){
    var out = {oro:null,plata:null,bronce:null,cuarto:null};
    if(!comp || !comp.bracket) return out;

    function winnerLoser(m){
      if(!m) return {w:null,l:null};
      var done = m.status==='done';
      var w = null, l = null;
      if(m.winner===1){ w=m.t1; l=m.t2; }
      else if(m.winner===2){ w=m.t2; l=m.t1; }
      else if(done && m.s1!=null && m.s2!=null){
        if(m.s1>m.s2){ w=m.t1; l=m.t2; }
        else if(m.s2>m.s1){ w=m.t2; l=m.t1; }
      }
      return {w:w,l:l};
    }

    var finalRound = comp.bracket.filter(function(r){ return /^\s*final\s*$/i.test(r.round||''); })[0];
    var tercerRound = comp.bracket.filter(function(r){ return /tercer puesto/i.test(r.round||''); })[0];

    if(finalRound && finalRound.matches && finalRound.matches[0]){
      var f = winnerLoser(finalRound.matches[0]);
      out.oro = f.w; out.plata = f.l;
    }
    if(tercerRound && tercerRound.matches && tercerRound.matches[0]){
      var t = winnerLoser(tercerRound.matches[0]);
      out.bronce = t.w; out.cuarto = t.l;
    }
    return out;
  }

  /* ───────────────────────────────────────────────
     renderMedalleria(comp) → htmlString
     Medallería placeholder derivada del bracket: oro/plata de la
     final, bronce/4º del tercer puesto. Placeholders ("1° Grupo A")
     o nombres vacíos → "por definir".
  ─────────────────────────────────────────────── */
  function renderMedalleria(comp){
    // resolver podio (reusa _resolvePodium si existe); fallback placeholder
    var oro='Por definir', plata='Por definir', bronce='Por definir';
    try{ var pod=_resolvePodium(comp); if(pod){ oro=pod.oro&&!isPlaceholder(pod.oro)?pod.oro:'Por definir'; plata=pod.plata&&!isPlaceholder(pod.plata)?pod.plata:'Por definir'; bronce=pod.bronce&&!isPlaceholder(pod.bronce)?pod.bronce:'Por definir'; } }catch(e){}
    var rows=[{pos:1,dep:oro,org:'Campeón',marca:''},{pos:2,dep:plata,org:'Subcampeón',marca:''},{pos:3,dep:bronce,org:'Tercer lugar',marca:''}];
    var avColor=function(n){ return n==='Por definir' ? '#cbd5e1' : teamColor(n); };
    var avInit=function(n){ return n==='Por definir' ? '?' : teamInit(n); };
    var order=[rows[1],rows[0],rows[2]], cls=['p2','p1','p3'];
    var items=order.map(function(r,i){ return '<div class="rep-podio__item '+cls[i]+'">'+(cls[i]==='p1'?'<div class="rep-podio__crown">👑</div>':'')+'<div class="rep-podio__avatar" style="background:'+avColor(r.dep)+'">'+esc(avInit(r.dep))+'</div><div class="rep-podio__name">'+esc(r.dep)+'</div><div class="rep-podio__org">'+esc(r.org)+'</div><div class="rep-podio__marca">'+(r.marca||'—')+'</div><div class="rep-podio__block"><span class="rep-podio__pos">'+r.pos+'°</span></div></div>'; }).join('');
    return '<div class="cr-podio-block"><div class="cr-podio-title">🏅 Podio (medallería)</div><div class="rep-podio">'+items+'</div></div>';
  }

  /* ───────────────────────────────────────────────
     renderComp(comp, el)
     Función principal — escribe en el DOM.
     Encabezado (emoji + nombre + sistema) → grupos → (si hay
     bracket) bloque "Fase final" con bracket + medallería.
  ─────────────────────────────────────────────── */
  function renderComp(comp, el){
    if(!el) return;
    if(!comp){ el.innerHTML = '<div class="cr-empty">Sin datos de competencia.</div>'; return; }

    var sub = [comp.deporte, comp.categoria, comp.genero].filter(Boolean).map(esc).join(' &middot; ');
    var html = '<div class="cr-comp-header">';
    if(comp.emoji) html += '<span class="cr-comp-emoji">'+esc(comp.emoji)+'</span>';
    html += '<div class="cr-comp-titles"><div class="cr-comp-name">'+esc(comp.nombre||'Competencia')+'</div>';
    if(sub) html += '<div class="cr-comp-sub">'+sub+'</div>';
    html += '</div>';
    if(comp.sistema) html += '<span class="cr-comp-sys">'+esc(comp.sistema)+'</span>';
    html += '</div>';

    /* Fase de grupos (maneja ausencia sin romper) */
    if(comp.grupos && comp.grupos.length){
      html += renderGrupos(comp);
    }

    /* Fase final */
    if(comp.bracket && comp.bracket.length){
      html += '<div class="cr-final-block">';
      html += '<h3 class="cr-final-title">🏆 Fase final</h3>';
      html += renderBracket(comp);
      html += renderMedalleria(comp);
      html += '</div>';
    }

    el.innerHTML = html;
  }

  /* Exponer API pública */
  window.CompRender = {
    teamColor: teamColor,
    teamInit: teamInit,
    renderStandings: renderStandings,
    renderGrupos: renderGrupos,
    renderBracket: renderBracket,
    renderMedalleria: renderMedalleria,
    renderComp: renderComp
  };
})();
