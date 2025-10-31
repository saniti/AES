// Locale and language configuration

const LOCALES = {
  'en-AU': {
    name: 'English (Australian)',
    dateFormat: 'en-AU',
    timezone: 'Australia/Sydney',
    translations: {
      dashboard: 'Dashboard',
      horses: 'Horses',
      sessions: 'Sessions',
      injuries: 'Injuries',
      documents: 'Documents',
      users: 'Users',
      logout: 'Logout',
      theme: 'Theme',
      selectStable: 'Select Stable',
      search: 'Search',
      filter: 'Filter',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      noData: 'No data available',
      injuryRisk: 'Injury Risk',
      lowRisk: 'Low Risk',
      mediumRisk: 'Medium Risk',
      highRisk: 'High Risk',
      noAssessment: 'No Assessment',
      allInjuryRisks: 'All Injury Risks',
      sessionPerformance: 'Session Performance',
      backToSessions: 'Back to Sessions',
      viewHorseProfile: 'View Horse Profile',
      downloadReport: 'Download Report',
      assign: 'Assign',
      unassignedSessions: 'Unassigned Sessions',
      selectHorse: 'Select horse...',
      horseName: 'Horse Name',
      rider: 'Rider',
      track: 'Track',
      duration: 'Duration',
      startTime: 'Start Time',
      endTime: 'End Time',
      lastSession: 'Last Session',
      dateOfBirth: 'Date of Birth',
      status: 'Status',
      gender: 'Gender',
      brand: 'Brand',
      rfid: 'RFID',
      alias: 'Alias'
    }
  },
  'en-US': {
    name: 'English (US)',
    dateFormat: 'en-US',
    timezone: 'America/New_York',
    translations: {
      dashboard: 'Dashboard',
      horses: 'Horses',
      sessions: 'Sessions',
      injuries: 'Injuries',
      documents: 'Documents',
      users: 'Users',
      logout: 'Logout',
      theme: 'Theme',
      selectStable: 'Select Stable',
      search: 'Search',
      filter: 'Filter',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      noData: 'No data available',
      injuryRisk: 'Injury Risk',
      lowRisk: 'Low Risk',
      mediumRisk: 'Medium Risk',
      highRisk: 'High Risk',
      noAssessment: 'No Assessment',
      allInjuryRisks: 'All Injury Risks',
      sessionPerformance: 'Session Performance',
      backToSessions: 'Back to Sessions',
      viewHorseProfile: 'View Horse Profile',
      downloadReport: 'Download Report',
      assign: 'Assign',
      unassignedSessions: 'Unassigned Sessions',
      selectHorse: 'Select horse...',
      horseName: 'Horse Name',
      rider: 'Rider',
      track: 'Track',
      duration: 'Duration',
      startTime: 'Start Time',
      endTime: 'End Time',
      lastSession: 'Last Session',
      dateOfBirth: 'Date of Birth',
      status: 'Status',
      gender: 'Gender',
      brand: 'Brand',
      rfid: 'RFID',
      alias: 'Alias'
    }
  },
  'es-ES': {
    name: 'Español',
    dateFormat: 'es-ES',
    timezone: 'Europe/Madrid',
    translations: {
      dashboard: 'Panel de Control',
      horses: 'Caballos',
      sessions: 'Sesiones',
      injuries: 'Lesiones',
      documents: 'Documentos',
      users: 'Usuarios',
      logout: 'Cerrar Sesión',
      theme: 'Tema',
      selectStable: 'Seleccionar Establo',
      search: 'Buscar',
      filter: 'Filtrar',
      edit: 'Editar',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      noData: 'No hay datos disponibles',
      injuryRisk: 'Riesgo de Lesión',
      lowRisk: 'Riesgo Bajo',
      mediumRisk: 'Riesgo Medio',
      highRisk: 'Riesgo Alto',
      noAssessment: 'Sin Evaluación',
      allInjuryRisks: 'Todos los Riesgos',
      sessionPerformance: 'Rendimiento de Sesión',
      backToSessions: 'Volver a Sesiones',
      viewHorseProfile: 'Ver Perfil del Caballo',
      downloadReport: 'Descargar Informe',
      assign: 'Asignar',
      unassignedSessions: 'Sesiones Sin Asignar',
      selectHorse: 'Seleccionar caballo...',
      horseName: 'Nombre del Caballo',
      rider: 'Jinete',
      track: 'Pista',
      duration: 'Duración',
      startTime: 'Hora de Inicio',
      endTime: 'Hora de Fin',
      lastSession: 'Última Sesión',
      dateOfBirth: 'Fecha de Nacimiento',
      status: 'Estado',
      gender: 'Género',
      brand: 'Marca',
      rfid: 'RFID',
      alias: 'Alias'
    }
  }
};

// Get current locale from localStorage or default
function getCurrentLocale() {
  return localStorage.getItem('locale') || 'en-AU';
}

// Set locale
function setLocale(locale) {
  if (LOCALES[locale]) {
    localStorage.setItem('locale', locale);
    return true;
  }
  return false;
}

// Get translation
function t(key) {
  const locale = getCurrentLocale();
  return LOCALES[locale]?.translations[key] || key;
}

// Format date according to locale
function formatDate(dateStr, options = {}) {
  if (!dateStr) return 'N/A';
  const locale = getCurrentLocale();
  const date = new Date(dateStr);
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return date.toLocaleDateString(LOCALES[locale].dateFormat, defaultOptions);
}

// Format datetime according to locale
function formatDateTime(dateStr, options = {}) {
  if (!dateStr) return 'N/A';
  const locale = getCurrentLocale();
  const date = new Date(dateStr);
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return date.toLocaleString(LOCALES[locale].dateFormat, defaultOptions);
}

// Format time according to locale
function formatTime(dateStr) {
  if (!dateStr) return 'N/A';
  const locale = getCurrentLocale();
  const date = new Date(dateStr);
  
  return date.toLocaleTimeString(LOCALES[locale].dateFormat, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Get timezone
function getTimezone() {
  const locale = getCurrentLocale();
  return LOCALES[locale].timezone;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LOCALES, getCurrentLocale, setLocale, t, formatDate, formatDateTime, formatTime, getTimezone };
}
