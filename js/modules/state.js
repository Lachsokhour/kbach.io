/**
 * Global state for the Kbach.io editor
 */
export const state = {
  updateTimer: null,
  currentW: 1200,
  currentH: 630,
  autoHeight: false,
  exportScale: parseInt(localStorage.getItem('kbach_export_scale')) || 2,
  jar: null,
  lastCode: '',
  saveTimerID: null,
  
  // Effects Panel State
  effectBlur: parseInt(localStorage.getItem('kbach_effect_blur')) || 0,
  effectNoise: parseInt(localStorage.getItem('kbach_effect_noise')) || 0,
  effectSat: parseInt(localStorage.getItem('kbach_effect_sat')) || 100,
  effectOpac: parseInt(localStorage.getItem('kbach_effect_opac')) || 100,

  // Feature Flags
  useTailwind: localStorage.getItem('kbach_use_tailwind') !== 'false',
  useReset: localStorage.getItem('kbach_use_reset') === 'true',
  useLucide: localStorage.getItem('kbach_use_lucide') !== 'false', // Default true
  googleFonts: localStorage.getItem('kbach_google_fonts') || 'Inter, Nunito'
};
