/**
 * Datos del menú por rol.
 *
 * Fuente: docs/architecture/role-menu-matrix.md de suite-web-v2 (v0.1)
 * Esta es la spec visual; el código real vive en suite-web-v2.
 */

/* ─── Catálogo de roles ────────────────────────────────────────────── */
/**
 * Cada rol simula un usuario con un nombre, email y los `assignedRoles`
 * que tendría asignados en producción (Modelo A — ver role-menu-matrix.md).
 *
 * Si `assignedRoles.length > 1`, el dropdown del avatar muestra una sección
 * "Cambiar a" con los demás roles. Si tiene 1 solo, esa sección no aparece.
 *
 * Las combinaciones reflejan casos típicos: gestores que también operan
 * (EVENT_MANAGER + EVENT_COORDINATOR), agentes de documentación que también
 * revisan, surveyors que también inspeccionan, etc.
 */
export const ROLES = {
  ROOT:                   { code: 'ROOT',                   label: 'Super Admin',           color: '#7c3aed', userName: 'Sofía Rodríguez',  userEmail: 'sofia.rodriguez@mindeporte.gov.co',   assignedRoles: ['ROOT'] },
  ADMIN:                  { code: 'ADMIN',                  label: 'Administrador',         color: '#1f8923', userName: 'Andrea Salas',    userEmail: 'andrea.salas@mindeporte.gov.co',     assignedRoles: ['ADMIN', 'EVENT_MANAGER'] },
  USER_MANAGER:           { code: 'USER_MANAGER',           label: 'Gestor de usuarios',    color: '#1f78d1', userName: 'Laura Martínez',   userEmail: 'laura.martinez@mindeporte.gov.co',    assignedRoles: ['USER_MANAGER'] },
  EVENT_MANAGER:          { code: 'EVENT_MANAGER',          label: 'Gestor de eventos',     color: '#FF7500', userName: 'Andrés Gómez',     userEmail: 'andres.gomez@mindeporte.gov.co',      assignedRoles: ['EVENT_MANAGER', 'EVENT_COORDINATOR'] },
  ACCESS_MANAGER:         { code: 'ACCESS_MANAGER',         label: 'Access Manager',        color: '#002B5B', userName: 'Daniel Barreto',   userEmail: 'daniel.barreto@mindeporte.gov.co',    assignedRoles: ['ACCESS_MANAGER'] },
  EVENT_COORDINATOR:      { code: 'EVENT_COORDINATOR',      label: 'Coordinador de eventos', color: '#FF7500', userName: 'Laura Méndez',   userEmail: 'laura.mendez@mindeporte.gov.co',    assignedRoles: ['EVENT_COORDINATOR'] },
  DIGITIZER:              { code: 'DIGITIZER',              label: 'Digitador',             color: '#d74009', userName: 'Carlos Restrepo',     userEmail: 'carlos.restrepo@mindeporte.gov.co',      assignedRoles: ['DIGITIZER'] },
  DOCUMENTATION_MANAGER:  { code: 'DOCUMENTATION_MANAGER',  label: 'Gestor de docs',        color: '#1f78d1', userName: 'Camila Vélez',     userEmail: 'camila.velez@mindeporte.gov.co',      assignedRoles: ['DOCUMENTATION_MANAGER', 'DOCUMENTATION_REVIEWER'] },
  DOCUMENTATION_REVIEWER: { code: 'DOCUMENTATION_REVIEWER', label: 'Revisor de docs',       color: '#1f78d1', userName: 'Felipe Ríos',      userEmail: 'felipe.rios@mindeporte.gov.co',       assignedRoles: ['DOCUMENTATION_REVIEWER'] },
  ATHLETE:                { code: 'ATHLETE',                label: 'Deportista',            color: '#1f8923', userName: 'Valentina Ortiz',  userEmail: 'valentina.ortiz@gmail.com',           assignedRoles: ['ATHLETE'] },
  LEGAL_GUARDIAN:         { code: 'LEGAL_GUARDIAN',         label: 'Acudiente legal',       color: '#1f8923', userName: 'Patricia López',   userEmail: 'patricia.lopez@gmail.com',            assignedRoles: ['LEGAL_GUARDIAN'] },
  ORGANIZATION_MANAGER:   { code: 'ORGANIZATION_MANAGER',   label: 'Gestor organización',   color: '#002B5B', userName: 'Juan Hernández',   userEmail: 'juan.hernandez@liganacional.org.co',  assignedRoles: ['ORGANIZATION_MANAGER'] },
  SUPPORT_STAFF:          { code: 'SUPPORT_STAFF',          label: 'Operador (soporte)',    color: '#7c3aed', userName: 'Lucía Herrera',    userEmail: 'lucia.herrera@mindeporte.gov.co',     assignedRoles: ['SUPPORT_STAFF'] },
  VENUE_SURVEYOR:         { code: 'VENUE_SURVEYOR',         label: 'Levantador escenarios', color: '#646587', userName: 'Miguel Quintero',  userEmail: 'miguel.quintero@mindeporte.gov.co',   assignedRoles: ['VENUE_SURVEYOR', 'VENUE_INSPECTOR'] },
  VENUE_INSPECTOR:        { code: 'VENUE_INSPECTOR',        label: 'Inspector escenarios',  color: '#646587', userName: 'Ana Salazar',      userEmail: 'ana.salazar@mindeporte.gov.co',       assignedRoles: ['VENUE_INSPECTOR'] }
};

/* ─── Iconos inline (SVG) ──────────────────────────────────────────── */
const ICONS = {
  home:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l9-9 9 9"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/></svg>',
  users:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  doc:         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>',
  trophy:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4a2 2 0 0 1-2-2V5h4"/><path d="M18 9h2a2 2 0 0 0 2-2V5h-4"/><path d="M6 9a6 6 0 0 0 12 0V3H6z"/><path d="M9 21h6"/><path d="M12 17v4"/></svg>',
  calendar:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  ticket:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 0 0 4v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 0 0-4z"/><line x1="12" y1="3" x2="12" y2="21" stroke-dasharray="2 2"/></svg>',
  pin:         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  shield:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  edit:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  gear:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  whistle:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/><path d="M15 5l4 4"/></svg>',
  user:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  family:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="6" r="3"/><circle cx="17" cy="8" r="2.5"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M14 17a3 3 0 0 1 3-3h1a3 3 0 0 1 3 3v4"/></svg>',
  bank:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7 12 2"/></svg>',
  gift:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>',
  logout:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  chevron:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
  burger:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>',
  bell:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  check:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  /* Una persona + lápiz — para "Digitadores" (los que digitan resultados) */
  userPen:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3.5"/><path d="M3 21v-2a4 4 0 0 1 4-4h5"/><path d="M17.5 11.5a2.121 2.121 0 1 1 3 3L14 21l-4 1 1-4 6.5-6.5z"/></svg>',
  /* Una persona + check — para "Coordinadores" (rol de validación/aprobación) */
  userCheck:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3.5"/><path d="M3 21v-2a4 4 0 0 1 4-4h5"/><polyline points="15 12 17 14 21 10"/></svg>',
  /* ID card — para módulo Acreditación */
  idCard:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 16.5c.7-1.5 2-2.5 3.5-2.5s2.8 1 3.5 2.5"/><line x1="15" y1="10" x2="19" y2="10"/><line x1="15" y1="13" x2="18" y2="13"/></svg>',
  /* Bar chart — para módulo Reportería */
  chart:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><rect x="7" y="13" width="3" height="5"/><rect x="12" y="9" width="3" height="9"/><rect x="17" y="6" width="3" height="12"/></svg>',
  /* Podium — para módulo Resultados & Ranking */
  podium:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="14" width="6" height="7"/><rect x="9" y="9" width="6" height="12"/><rect x="15" y="11" width="6" height="10"/><path d="M12 5v2"/><circle cx="12" cy="4" r="1.5"/></svg>',
  /* File search — para módulo Auditoría */
  audit:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h7"/><path d="M14 2l6 6"/><path d="M14 2v6h6"/><circle cx="17" cy="17" r="3"/><path d="M19.2 19.2L21 21"/></svg>',
  /* Module — para "Activación de módulos" */
  module:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>',
  /* Map (folded) — para "Mapa de escenarios" */
  map:         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 8 3 16 6 23 3 23 18 16 21 8 18 1 21 1 6"/><line x1="8" y1="3" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="21"/></svg>',
  /* Shuffle — para "Sorteo" */
  sorteo:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>'
};

export function getIcon(name) {
  return ICONS[name] || '';
}

/* ─── Items por rol ────────────────────────────────────────────────────
   Estructura: cada rol → array de secciones, cada sección con array de items.
   Item: { id, label, icon, route?, children? }
   ─────────────────────────────────────────────────────────────────── */

const ITEMS = {
  // Items reusables
  inicio:           { id: 'inicio',          label: 'Inicio',                icon: 'home',     route: '/home' },
  perfil:           { id: 'perfil',          label: 'Mi perfil',             icon: 'user',     route: '/home/profile' },

  // GESTIÓN DEPORTIVA
  eventos:          { id: 'eventos',         label: 'Eventos',               icon: 'calendar', route: '/home/events',
                      children: [
                        { id: 'eventos-lista',  label: 'Listado', route: '/home/events' },
                        { id: 'eventos-nuevo',  label: 'Crear evento', route: '/home/events/nuevo' }
                      ]},
  competencias:     { id: 'competencias',    label: 'Competencias',          icon: 'trophy',   route: '/home/competencias',
                      children: [
                        { id: 'competencias-lista',  label: 'Lista de competencias', route: '/home/competencias/lista' },
                        { id: 'competencias-nueva',  label: 'Nueva competencia',     route: '/home/competencias/nueva' }
                      ]},
  sorteo:           { id: 'sorteo',          label: 'Sorteo',                icon: 'sorteo',   route: '/home/sorteo' },
  cupos:            { id: 'cupos',           label: 'Cupos',                 icon: 'ticket',   route: '/home/quotas' },
  inscripciones:    { id: 'inscripciones',   label: 'Inscripciones',         icon: 'edit',     route: '/home/inscripciones' },
  documentacion:    { id: 'docs',            label: 'Documentación',         icon: 'doc',      route: '/home/docs' },

  // ESCENARIOS
  sedes:            { id: 'sedes',           label: 'Sedes',                 icon: 'pin',      route: '/home/sedes',
                      children: [
                        { id: 'sedes-lista',     label: 'Listado',     route: '/home/sedes' },
                        { id: 'sedes-aprobacion',label: 'Aprobación', route: '/home/inspector' }
                      ]},
  mapaEscenarios:   { id: 'mapa-escenarios', label: 'Mapa de escenarios',    icon: 'map',      route: '/home/sedes/mapa' },
  inspeccion:       { id: 'inspector',       label: 'Inspección',            icon: 'shield',   route: '/home/inspector' },

  // DIGITACIÓN
  miDigitacion:     { id: 'mi-digitacion',   label: 'Mi digitación',         icon: 'whistle',   route: '/home/digitacion/mi-digitacion' },
  digitadores:      { id: 'digitadores',     label: 'Digitadores',           icon: 'userPen',   route: '/home/digitacion/digitadores' },
  coordinadores:    { id: 'coordinadores',   label: 'Coordinadores',         icon: 'userCheck', route: '/home/digitacion/coordinadores' },

  // USUARIOS
  gestionUsuarios:  { id: 'user-management', label: 'Gestión de usuarios',   icon: 'users',    route: '/home/user-management' },

  // MI ESPACIO (individuales / organización)
  misInscripciones: { id: 'mis-inscripciones', label: 'Mis inscripciones',   icon: 'edit',     route: '/home/inscripciones' },
  misDependientes:  { id: 'mis-dependientes',  label: 'Mis dependientes',    icon: 'family',   route: '/home/dependents' },
  miOrganizacion:   { id: 'mi-organizacion',   label: 'Mi organización',     icon: 'bank',     route: '/home/my-organization' },
  incentivosMios:   { id: 'mis-incentivos',    label: 'Mis incentivos',      icon: 'gift',     route: '/home/incentivos' },

  // OPERADOR
  asignarIncentivos:{ id: 'asignar-incentivos', label: 'Asignar incentivos', icon: 'gift',     route: '/home/incentivos/asignar' },

  // ACREDITACIÓN (módulo nuevo — roadmap)
  acreditaciones:   { id: 'acreditaciones',   label: 'Acreditaciones',       icon: 'idCard',   route: '/home/acreditaciones' },
  miAcreditacion:   { id: 'mi-acreditacion',  label: 'Mi acreditación',      icon: 'idCard',   route: '/home/mi-acreditacion' },

  // REPORTERÍA (módulo nuevo — roadmap)
  dashboards:       { id: 'dashboards',       label: 'Dashboards',           icon: 'chart',    route: '/home/reportes/dashboards' },
  reportes:         { id: 'reportes',         label: 'Reportes',             icon: 'chart',    route: '/home/reportes' },

  // RESULTADOS & RANKING (módulo nuevo — roadmap)
  resultados:       { id: 'resultados',       label: 'Resultados',           icon: 'podium',   route: '/home/resultados' },
  ranking:          { id: 'ranking',          label: 'Ranking',              icon: 'podium',   route: '/home/ranking' },

  // PLATAFORMA (admin de plataforma — solo ROOT)
  rolesPermisos:    { id: 'admin-roles',      label: 'Roles y permisos',     icon: 'shield',   route: '/home/admin/roles' },
  usuariosPlatform: { id: 'admin-users',      label: 'Usuarios platform',    icon: 'users',    route: '/home/admin/users' },
  activacionModulos:{ id: 'admin-modules',    label: 'Activación de módulos',icon: 'module',   route: '/home/admin/modules' },
  configInstancia:  { id: 'admin-config',     label: 'Configuración',        icon: 'gear',     route: '/home/admin/config' },
  administracion:   { id: 'administration',   label: 'Administración',       icon: 'gear',     route: '/home/administration' },

  // AUDITORÍA (módulo cross-cutting — roadmap)
  logsActividad:    { id: 'audit-logs',       label: 'Auditoría',            icon: 'audit',    route: '/home/auditoria/logs' }
};

/* Each role's menu = array of { sectionLabel, items[] }.
   Las "secciones" son ahora MÓDULOS formalizados según
   docs/architecture/role-menu-matrix.md V0.2.
   "Mi perfil" NO va en el sidebar — vive solo en el dropdown del avatar
   (single source of truth, patrón global UX). */
export const MENU_BY_ROLE = {
  ROOT: [
    { section: null,                       items: [ITEMS.inicio] },
    { section: 'EVENTOS',                  items: [ITEMS.eventos, ITEMS.cupos] },
    { section: 'COMPETENCIAS',             items: [ITEMS.competencias, ITEMS.sorteo] },
    { section: 'INSCRIPCIONES',            items: [ITEMS.inscripciones] },
    /* Mi digitación NO aparece para ROOT — esa vista es exclusiva
       del rol DIGITIZER. ROOT supervisa via Digitadores/Coordinadores. */
    { section: 'DIGITACIÓN',               items: [ITEMS.digitadores, ITEMS.coordinadores] },
    { section: 'DOCUMENTACIÓN',            items: [ITEMS.documentacion] },
    { section: 'ESCENARIOS',               items: [ITEMS.sedes, ITEMS.mapaEscenarios] },
    { section: 'INCENTIVOS',               items: [ITEMS.asignarIncentivos] },
    { section: 'ACREDITACIÓN',             items: [ITEMS.acreditaciones] },
    { section: 'REPORTERÍA',               items: [ITEMS.dashboards, ITEMS.reportes] },
    { section: 'RESULTADOS & RANKING',     items: [ITEMS.resultados, ITEMS.ranking] },
    { section: 'USUARIOS',                 items: [ITEMS.gestionUsuarios] },
    { section: 'PLATAFORMA',               items: [ITEMS.rolesPermisos, ITEMS.usuariosPlatform, ITEMS.activacionModulos, ITEMS.configInstancia, ITEMS.administracion] },
    { section: null,                       items: [ITEMS.logsActividad] }
  ],

  ADMIN: [
    { section: 'DASHBOARD',                items: [ITEMS.inicio] },
    { section: 'GESTIÓN',                  items: [ITEMS.competencias, ITEMS.digitadores, ITEMS.coordinadores, ITEMS.logsActividad] }
  ],

  USER_MANAGER: [
    { section: null,                       items: [ITEMS.inicio] },
    { section: 'USUARIOS',                 items: [ITEMS.gestionUsuarios] }
  ],

  EVENT_MANAGER: [
    { section: null,                       items: [ITEMS.inicio] },
    { section: 'EVENTOS',                  items: [ITEMS.eventos, ITEMS.cupos] },
    { section: 'REPORTERÍA',               items: [ITEMS.dashboards] }
  ],

  EVENT_COORDINATOR: [
    { section: 'DASHBOARD',                items: [ITEMS.inicio] },
    { section: 'GESTIÓN',                  items: [ITEMS.competencias, ITEMS.sorteo, ITEMS.digitadores, ITEMS.coordinadores, ITEMS.logsActividad] }
  ],

  DIGITIZER: [
    { section: 'DASHBOARD',                items: [ITEMS.inicio] },
    { section: 'GESTIÓN',                  items: [ITEMS.miDigitacion] }
  ],

  DOCUMENTATION_MANAGER: [
    { section: null,                       items: [ITEMS.inicio] },
    { section: 'DOCUMENTACIÓN',            items: [ITEMS.documentacion] }
  ],

  DOCUMENTATION_REVIEWER: [
    { section: null,                       items: [ITEMS.inicio] },
    { section: 'DOCUMENTACIÓN',            items: [ITEMS.documentacion] }
  ],

  ATHLETE: [
    { section: null,                       items: [ITEMS.inicio] },
    { section: 'INSCRIPCIONES',            items: [ITEMS.misInscripciones] },
    { section: 'INCENTIVOS',               items: [ITEMS.incentivosMios] },
    { section: 'ACREDITACIÓN',             items: [ITEMS.miAcreditacion] },
    { section: 'RESULTADOS & RANKING',     items: [ITEMS.resultados, ITEMS.ranking] }
  ],

  LEGAL_GUARDIAN: [
    { section: null,                       items: [ITEMS.inicio] },
    { section: 'IDENTIDAD',                items: [ITEMS.misDependientes] },
    { section: 'INSCRIPCIONES',            items: [ITEMS.misInscripciones] }
  ],

  ORGANIZATION_MANAGER: [
    { section: null,                       items: [ITEMS.inicio] },
    { section: 'IDENTIDAD',                items: [ITEMS.miOrganizacion] },
    { section: 'INSCRIPCIONES',            items: [ITEMS.misInscripciones] },
    { section: 'RESULTADOS & RANKING',     items: [ITEMS.resultados, ITEMS.ranking] }
  ],

  SUPPORT_STAFF: [
    { section: null,                       items: [ITEMS.inicio] },
    { section: 'INCENTIVOS',               items: [ITEMS.asignarIncentivos] }
  ],

  VENUE_SURVEYOR: [
    { section: null,                       items: [ITEMS.inicio] },
    { section: 'ESCENARIOS',               items: [ITEMS.sedes, ITEMS.mapaEscenarios] }
  ],

  VENUE_INSPECTOR: [
    { section: null,                       items: [ITEMS.inicio] },
    { section: 'ESCENARIOS',               items: [ITEMS.inspeccion] }
  ]
};

/* ── Demo de Sorteo · chrome de suite-web-v2 ────────────────────────────
   El sidebar muestra solo la rama que importa: "Listado de eventos" con sus
   dos hijos gateados por permiso. "Sorteos" es la única página de esta demo;
   "Gestión de usuarios" queda inerte como referencia del patrón. */
const EVENT_CODE = 'jin-2026';
const SUITE_ITEMS = {
  analitica:      { id: 'analitica',        label: 'Analítica',                icon: 'chart' },
  gestUsuarios:   { id: 'gest-usuarios',    label: 'Gestión de usuarios',      icon: 'users' },
  documentacion:  { id: 'documentacion',    label: 'Documentación',            icon: 'doc',   children: [ { id: 'doc-aprobacion', label: 'Aprobación' } ] },
  eventos:        { id: 'events',           label: 'Listado de eventos',       icon: 'calendar',
                    children: [
                      { id: 'event-users',          label: 'Gestión de usuarios' },
                      { id: 'event-draws',          label: 'Sorteos', route: `/home/events/${EVENT_CODE}/draws` }
                    ] },
  docEventos:     { id: 'docs-events',      label: 'Documentación',            icon: 'doc',   children: [ { id: 'docs-events-aprobacion', label: 'Aprobación' } ] },
  bloqueoProm:    { id: 'bloqueo-prom',     label: 'Bloqueo de promociones',   icon: 'shield' },
  gestAccesos:    { id: 'gest-accesos',     label: 'Gestión de accesos',       icon: 'idCard' },
  cupos:          { id: 'quotas',           label: 'Cupos',                    icon: 'ticket' },
  miDoc:          { id: 'mi-doc',           label: 'Mi documentación',         icon: 'doc' },
  personalAcred:  { id: 'personal-acred',   label: 'Personal de acreditación', icon: 'userCheck' },
  digitacion:     { id: 'digitacion',       label: 'Digitación',               icon: 'module', children: [ { id: 'digitacion-inicio', label: 'Inicio' } ] },
  mapa:           { id: 'mapa',             label: 'Mapa',                     icon: 'map' },
  escenarios:     { id: 'escenarios',       label: 'Escenarios',               icon: 'pin' },
  usuariosEsc:    { id: 'usuarios-esc',     label: 'Usuarios de escenarios',   icon: 'users' },
  administracion: { id: 'administracion',   label: 'Administración',           icon: 'gear',  children: [ { id: 'admin-catalogos', label: 'Catálogos' } ] },
  parametrizacion:{ id: 'parametrizacion',  label: 'Parametrización',          icon: 'gear' },
  entregaAcred:   { id: 'entrega-acred',    label: 'Entrega de acreditaciones',icon: 'idCard' },
  auditoria:      { id: 'auditoria',        label: 'Auditoría',                icon: 'audit' },
};
/* Solo lo que importa para el sorteo: la sección del evento con "Listado de
   eventos" y sus dos hijos gateados por permiso (Gestión de usuarios como
   referencia del patrón, Sorteos como la página de esta demo). */
const SUITE_MENU = [
  { section: 'EVENTO DEPORTIVO', items: [SUITE_ITEMS.eventos] },
];
export function getMenuForRole(roleCode) {
  return SUITE_MENU;
}

/* Para un childId dado, retorna el id del item padre (parent) que lo contiene.
   Si el id es de un parent (no child) o no existe, retorna null.
   Usado para detectar si un cambio de active es intra-parent (slide del dot)
   o cross-parent (scale-in del dot desde 0). */
export function findParentOfChild(roleCode, childId) {
  const sections = getMenuForRole(roleCode);
  for (const section of sections) {
    for (const item of section.items) {
      if (item.children && item.children.some((c) => c.id === childId)) {
        return item.id;
      }
    }
  }
  return null;
}
