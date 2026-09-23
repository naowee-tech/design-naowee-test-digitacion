# Sorteo · demo v3 — especificación para desarrollo

Fecha: 2026-09-23. Fuente: reunión "Sorteo y fechas" (Danna, Juanma, Jonathan) + decisión de Juanma sobre ubicación en la suite.
Alcance: primer sorteo de Juegos Intercolegiados Nacionales. Todo lo que no está aquí queda fuera de esta entrega.

## 0. Resumen en una frase

Dentro de un evento, el Access Manager entra a una **promoción** (paso de una fase a la siguiente) y ahí crea, por cada prueba de conjunto, un **sorteo automático** que reparte a las instituciones de la fase origen en grupos y deja los enfrentamientos iniciales creados vacíos en la fase destino. Fechas, escenarios y resultados los maneja Digitación.

## 1. Jerarquía y pantallas

```
Evento (índice)                       /home/events/:code
└─ Sorteos                            /home/events/:code/draws            → S1 Promociones del evento
   └─ Promoción X → Y                 /home/events/:code/draws/:promotionCode      → S2 Sorteos de la promoción
      ├─ Crear sorteo (asistente)     …/draws/:promotionCode/new         → S3 (4 pasos + resultado)
      └─ Sorteo                       …/draws/:promotionCode/:drawCode    → S4 Detalle (abierto o cerrado)
Vista pública                         /public/draws/:drawCode              → S5 (sin sesión)
```

### S0 · Índice del evento (solo referencia de chrome, no se construye)
Tarjeta "Sorteos" junto a Fases, Catálogo deportivo, Consolidado de intenciones y Accesos. Subtítulo con conteo: "3 sorteos hechos · 2 promociones". Visible con el mismo gate que Accesos.

### S1 · Promociones del evento
- Título "Sorteos". Subtítulo "Elige la promoción que vas a sortear".
- Una fila o tarjeta por promoción válida (ver §3). Cada una muestra: "Regional → Nacional", fechas de la fase origen, estado de resultados de la fase origen (`Resultados cargados` / `Sin resultados aún`), y progreso "3 de 8 pruebas sorteadas".
- Estados:
  - con datos: lista de promociones.
  - vacío: el evento no tiene dos fases elegibles consecutivas para ningún deporte de conjunto → "Este evento no tiene promociones para sortear. Revisa la elegibilidad por fase en el catálogo deportivo."
  - error: "No pudimos cargar las promociones del evento. Reintenta." con botón Reintentar.
- Única apuesta visual de la demo: aquí. El resto de pantallas es tabla y formulario del design system.

### S2 · Sorteos de una promoción
- Encabezado: "Regional → Nacional" con las fechas de la fase destino. Botón principal **Crear sorteo**.
- Tabla: Prueba (deporte · categoría · rama), Equipos, Grupos, Estado (`Abierto` / `Cerrado`), acción **Ver resultado**.
- Filtros: búsqueda por texto y deporte. Sin región ni fecha.
- Regla "ya existe": el asistente no ofrece pruebas que ya tienen sorteo en esta promoción; si el usuario llega por URL a crear una repetida, el paso 1 muestra el aviso "Ya creaste este sorteo" con botón **Ver resultado**. No hay "reprogramar".
- Estados:
  - vacío: "Aún no hay sorteos en esta promoción. Crea el primero." + Crear sorteo.
  - sin resultados en fase origen: banner informativo, no bloqueante: "La fase Regional aún no tiene resultados. Los clasificados no se marcan solos; podrás elegirlos a mano."
  - error: mensaje + Reintentar.

### S3 · Crear sorteo (asistente)
Pasos en el stepper: **1 Prueba · 2 Participantes · 3 Grupos y líderes · 4 Sorteo**. El resultado se ve al terminar el paso 4.

1. **Prueba**. Deporte (solo de conjunto del catálogo del evento), categoría, rama. Sin "tipo de deporte", sin individual. Aviso de duplicado según §6.
2. **Participantes**. Lista de todas las instituciones inscritas en la fase origen para esa prueba, con checkbox. Marcadas por defecto las clasificadas (según resultados o promociones de la fase origen). Contador "8 seleccionadas de 23". Se puede marcar o desmarcar cualquiera. Mínimo 2.
3. **Grupos y líderes**. Número de grupos (tope = seleccionadas / 2). Reparto calculado en vivo ("2 grupos de 4"). Por cada grupo, un selector opcional de **líder** (institución que queda fija en ese grupo). Un mismo equipo no puede ser líder de dos grupos.
4. **Sorteo**. Botón **Sortear**. Animación de reparto (la ruleta actual). Al terminar: grupos con sus equipos y enfrentamientos "todos contra todos" por jornada, sin fecha ni escenario.
   - Acciones: **Resortear** (vuelve a repartir a los no líderes) y **Cerrar sorteo**.
   - Cerrar pide confirmación: "Al cerrar no podrás resortear. Los enfrentamientos quedarán creados en la fase Nacional para que Digitación los programe."

- Estados: paso 2 sin instituciones → "No hay instituciones inscritas en Regional para esta prueba." (no se puede continuar). Paso 3 con reparto inválido → mensaje negativo del design system, Siguiente deshabilitado.

### S4 · Detalle de un sorteo
- Cabecera: prueba, promoción, estado, fecha de cierre y usuario que cerró.
- Pestañas: **Grupos** (roster + enfrentamientos por jornada) y **Fase final** (solo si hay más de un grupo; llaves vacías).
- Abierto: botones Resortear y Cerrar sorteo. Cerrado: solo **Ver vista pública** y **Copiar enlace**. Nada de programación ni posiciones.

### S5 · Vista pública
Igual a la actual, recortada: hero, grupos y enfrentamientos, fase final si existe. Sin posiciones ni programación.

## 2. Chrome que imita suite-web-v2

- Sidebar: sección **EVENTO DEPORTIVO** con "Listado de eventos" expandido y activo, y como hijo activo **Sorteos**. Los demás hijos reales de la suite (Gestión de usuarios, Departamentos, Municipios, Instituciones, Deportistas, Personal de apoyo) se muestran inertes, para que el dev vea dónde cae. Las demás secciones del sidebar de la suite (Dashboard, Gestión, Escenarios, Administración, Acreditaciones) se muestran colapsadas y sin ruta.
- Breadcrumb: `Inicio › Eventos › Juegos Intercolegiados Nacionales 2026 › Sorteos` (+ `› Regional → Nacional` en S2, + `› Baloncesto Sub-18 Femenino` en S4).
- Header: nombre del evento con badge "En curso" y chip de usuario.
- Rol único: `ACCESS_MANAGER` · "Access Manager" · Daniel Barreto. Se pasa por `?role=ACCESS_MANAGER` y es el fallback.

Cómo se refleja en el código de la demo:
- `shared/menu-data.js`: `ROLES.ACCESS_MANAGER` añadido. `getMenuForRole()` devuelve siempre el menú de Sorteo (los diseñadores lo cambian por el árbol EVENTO DEPORTIVO › Listado de eventos › hijos).
- `shared/sidebar.js`: `DIGITACION_ROLE_GROUPS = [{ label:'Operación', codes:['ACCESS_MANAGER'] }]`, fallback de `resolveRoleCode` = `ACCESS_MANAGER`, `DIGI_ROUTES` solo con `sorteo`.
- `sorteo.html`: `resolveRoleCode('ACCESS_MANAGER')`.

Gate en la suite real: bypass ADMIN/ROOT o grant `event_draws:manage` sobre el evento, con el mismo mecanismo que `EventAccessService.canManageEventUsers`.

## 3. Datos de demo

Evento: **Juegos Intercolegiados Nacionales 2026**, estado En curso.

| # | Fase | Fechas | promotionMode |
|---|------|--------|---------------|
| 1 | Municipal | 4 may – 30 jun 2026 | DATA_ENTRY |
| 2 | Departamental | 6 jul – 14 ago 2026 | DATA_ENTRY |
| 3 | Regional | 24 ago – 25 sep 2026 | DATA_ENTRY |
| 4 | Nacional | 12 oct – 30 nov 2026 | MANUAL |

Deportes de conjunto del evento (solo estos aparecen): Baloncesto, Fútbol, Fútbol sala, Voleibol, Balonmano, Béisbol, Rugby 7. Categorías: Sub-14, Sub-16, Sub-18. Ramas: Masculino, Femenino, Mixto (solo donde aplique).

Elegibilidad (phase-eligibility): todos los de conjunto llegan hasta Nacional, salvo Rugby 7 y Béisbol que terminan en Regional. Por tanto:
- **Departamental → Regional**: válida para los 7 deportes. Semilla: vacía.
- **Regional → Nacional**: válida para 5 deportes. Semilla: 3 sorteos.
- Municipal → Departamental: válida pero cerrada en fecha (la fase destino ya pasó). Se lista deshabilitada con la etiqueta "Fase terminada".

Semilla Regional → Nacional:
| Prueba | Equipos | Grupos | Estado |
|--------|---------|--------|--------|
| Baloncesto Sub-18 Femenino | 8 | 2 | Cerrado (23 sep 2026, Daniel Barreto) |
| Fútbol Sub-16 Masculino | 8 | 2 | Abierto |
| Voleibol Sub-18 Masculino | 6 | 2 | Abierto |

Participantes por promoción y prueba: 12 a 24 instituciones de la fase origen, con nombre "I.E. La Salle de Cartagena" y meta "Norte · Cartagena". Las 8 primeras son las clasificadas (marcadas por defecto).

## 4. Store y rutas

`localStorage`, prefijo `naowee-sorteo-`:

```
naowee-sorteo-event                       → { code, name, phases:[…], sports:[…], eligibility:{…} }   (semilla, solo lectura)
naowee-sorteo-<promotionCode>-<drawId>    → registro de sorteo
```

Registro de sorteo:
```json
{ "id":"regional-nacional/baloncesto-sub-18-femenino",
  "promotion":{ "code":"regional-nacional", "from":"regional", "to":"nacional" },
  "prueba":{ "deporteLabel":"Baloncesto", "emoji":"🏀", "categoria":"Sub-18", "sexo":"Femenino" },
  "participantes":[{ "nombre":"…", "delegacion":"Norte", "clasificado":true, "grupoFijo":0 }],
  "config":{ "nGrupos":2 },
  "comp":{ "grupos":[{ "nombre":"Grupo A", "equipos":[…], "partidos":[{ "id":"…", "jornada":1, "t1":"…", "t2":"…", "status":"pending" }] }], "bracket":[…] },
  "estado":"ABIERTO" | "CERRADO",
  "ts": 1758600000000, "cerradoTs": null, "cerradoPor": null }
```
`promotionCode` = `<faseOrigen>-<faseDestino>` en minúsculas sin acentos. `drawId` = prueba normalizada. La unicidad "ya existe" es por `promotionCode + drawId`.

Rutas que verá el dev en la suite:
```
/home/events/:code/draws
/home/events/:code/draws/:promotionCode
/home/events/:code/draws/:promotionCode/new
/home/events/:code/draws/:promotionCode/:drawCode
```
En la demo cada ruta se simula con `?promo=` y `?draw=` sobre `sorteo.html`; el breadcrumb y el `data-screen` del `<body>` reflejan la ruta equivalente.

## 5. Copy deck (español, sentence case)

Acciones: **Crear sorteo** · **Siguiente** · **Atrás** · **Sortear** · **Resortear** · **Cerrar sorteo** · **Ver resultado** · **Ver vista pública** · **Copiar enlace** · **Reintentar**.

Títulos: "Sorteos" · "Regional → Nacional" · "Crear sorteo" · "Resultado del sorteo" · "Baloncesto Sub-18 Femenino".

Pasos: "Prueba" · "Participantes" · "Grupos y líderes" · "Sorteo".

Estados: `Abierto` · `Cerrado` · `Fase terminada` · `Resultados cargados` · `Sin resultados aún`.

Mensajes:
- Duplicado: "Ya creaste este sorteo. Baloncesto Sub-18 Femenino ya tiene un sorteo en Regional → Nacional." → Ver resultado.
- Cierre: "¿Cerrar el sorteo? No podrás resortear. Los enfrentamientos quedarán creados en la fase Nacional para que Digitación los programe." → Cerrar sorteo / Seguir revisando.
- Cerrado: "Sorteo cerrado. Los enfrentamientos ya están en la fase Nacional."
- Sin instituciones: "No hay instituciones inscritas en Regional para esta prueba."
- Fase sin resultados: "Regional aún no tiene resultados cargados. Marca los clasificados a mano."
- Reparto inválido: "Con 3 grupos algún grupo quedaría con menos de 2 equipos. Con 6 equipos el máximo es 3 grupos."

Solo las secciones del sidebar (EVENTO DEPORTIVO, DASHBOARD…) van en mayúsculas, como en la suite. Ningún otro texto.

## 6. Reglas de negocio

1. Solo deportes de conjunto del catálogo del evento. Solo modo automático.
2. Una prueba (deporte + categoría + rama) admite un sorteo por promoción. La validación vive en S2/S3: la prueba ya sorteada no se ofrece; por URL, aviso con Ver resultado.
3. Participantes = todas las instituciones inscritas en la fase origen para la prueba. Clasificados marcados por defecto. Lista editable.
4. Lo único manual: líderes de grupo. El resto es aleatorio y transparente. No se mueven equipos a mano.
5. Resortear solo mientras el sorteo está abierto. Cerrar es definitivo en esta entrega (la anulación queda fuera).
6. Al cerrar, los enfrentamientos "todos contra todos" por grupo se crean vacíos (sin fecha, hora, escenario ni marcador) en la fase destino. Programación y resultados: Digitación.
7. Fuera de alcance visible: individual, manual, "ya sorteado", programación, posiciones, exportar PDF, anulación con motivo, auditoría.

## 7. Recorrido guiado (sorteo-tour.js)

Decisión: **desactivado** en esta base. Las 8 HU del tour son las del xlsx anterior (incluyen "Ya sorteado", ruleta manual, programación y auditoría) y sus `pre()` llaman funciones que ya no existen. Se quita el `<script>` de `sorteo.html`; el archivo se conserva para reescribirlo con las HU de v3 cuando el diseño ganador fije los ids. Nunca se deja cargando roto.

## 8. Rúbrica de jueces (0–3 por criterio, máximo 30)

| # | Criterio | 0 | 3 |
|---|----------|---|---|
| 1 | Fidelidad al chrome de suite-web-v2 (sidebar EVENTO DEPORTIVO › Listado de eventos › Sorteos, breadcrumb, header con evento) | no se parece | indistinguible en estructura |
| 2 | Nada fuera de alcance visible (individual, manual, ya sorteado, programación, posiciones) | aparece algo | nada |
| 3 | Solo promociones válidas, derivadas de fases + elegibilidad | lista fija | derivadas y con estado de fecha |
| 4 | Participantes: clasificados por defecto + lista completa editable | uno de los dos falta | ambos, con contador |
| 5 | "Ya existe" bloquea dentro de la promoción | se puede duplicar | no se ofrece y avisa por URL |
| 6 | Resortear solo antes de cerrar; cierre confirmado | resortear siempre | correcto y con confirmación |
| 7 | Claridad para el dev: ruta equivalente y estado visibles en cada pantalla | hay que adivinar | breadcrumb + `data-screen` + estados vacío/error |
| 8 | Copy consistente con el deck | verbos mezclados | idéntico |
| 9 | Sin errores de consola ni 404 al recorrer S1→S5 | errores | limpio |
| 10 | Sobriedad: una sola apuesta visual (S1), resto design system | decoración repartida | disciplina |

## 9. Hooks DOM estables (los diseñadores deben respetarlos)

- `<body data-screen="promociones|sorteos|crear|detalle|publico">` y `data-route` con la ruta equivalente.
- Contenedores: `#sidebarRoot`, `#topHeader`, `#breadcrumb`, `#eventHeader`.
- Stages: `#promoStage` (S1, nuevo), `#progEditStage` (S2 lista y S4 detalle, id heredado), `#wizardStage` (S3 pasos 1 y 3), `#clasifStage` (S3 paso 2), `#ruletaStage` (S3 paso 4), `#previewStage` (resultado).
- Asistente: `#wzStep1..4`, `#panel1..3`, `#ddDeporte`, `#ddCategoria`, `#ddSexo`, `#dupWarn`, `#inGrupos`, `#repartoMsg`, `#btnNext`, `#btnBack`.
- Participantes: `#clasifList`, `#clasifCount`, `#clasifDerived`, `#btnClasifNext`.
- Resultado: `#previewTabs`, `#previewPanel`, `#btnResortear`, `#btnConfirmSorteo` (Cerrar sorteo).
- Lista: `#progEditBody`, `#btnCrearSorteo`, `#progSearchInput`, `#ddFDeporte`.
- Globales JS que el tour v3 y los jueces pueden invocar: `openProgEdit()`, `openCrearSorteo()`, `selDeporte()`, `goStep(n)`, `startClasificados()`, `startRuleta()`, `showPreview()`, `reSortear()`, `confirmSorteo()`, `editProg(id)`.

## 10. Decisión de diseño (2026-09-23)

Se integró la variante B tras la evaluación de dos jueces (28/30 y 27/30, primera en ambos).

- **S1 Promociones usa el patrón feature-card del índice del evento de suite-web-v2** (`event-detail__feature-card`): una tarjeta por promoción válida con paso de fase (`3 → 4`), estado de resultados de la fase origen, avance "N sorteos · X de Y deportes con sorteo" y chevron. La promoción con fase destino vencida se atenúa como `Fase terminada` sin clic. `?state=empty|error` muestra vacío y error.
- Ajustes aplicados sobre B a partir de los jueces:
  1. Detalle de sorteo con acciones por estado: `Abierto` → Resortear / Cerrar sorteo (modal de cierre); `Cerrado` → Ver vista pública / Copiar enlace. Resortear desde el detalle reconstruye el asistente con los mismos participantes y, al cerrar, actualiza el mismo registro. El store gana sobre la semilla por id.
  2. Cabecera del evento como título grande con flecha y badge `En curso` en todas las pantallas.
  3. "Sorteos" cuelga de "Listado de eventos" justo después de "Gestión de usuarios" (los dos ítems gateados por permiso de evento).
  4. "Cancelar" reemplazado por "Regresar a la lista" en el asistente.
- Puntos de entrada: `index.html` y los stubs `digitacion/sorteo*.html` llevan al rol `ACCESS_MANAGER` (un `?role=EVENT_COORDINATOR` heredado se reescribe).
