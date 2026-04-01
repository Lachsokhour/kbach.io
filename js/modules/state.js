/**
 * Global state for the Kbach.io editor
 */
export const state = {
  updateTimer: null,
  currentW: 1200,
  currentH: 630,
  autoHeight: false,
  jar: null,
  lastCode: '',
  saveTimerID: null,
  
  // Effects Panel State
  effectBlur: 0,
  effectNoise: 0,
  effectSat: 100,
  effectOpac: 100
};
