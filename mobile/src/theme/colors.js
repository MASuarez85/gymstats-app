// Portado 1:1 de las constantes COLORS / MUSCLE_COLORS de la app web original (src/App.jsx),
// para mantener la misma estética "pizarra de gimnasio" en la versión nativa.
export const MUSCLE_GROUPS = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Glúteos', 'Cardio'];

export const MUSCLE_COLORS = {
  Pecho: '#FA114F',
  Espalda: '#FF9F0A',
  Piernas: '#A2E834',
  Hombros: '#0AF6F1',
  Brazos: '#BF5AF2',
  Core: '#FFD60A',
  Glúteos: '#FF6482',
  Cardio: '#64D2FF',
};

// Tema oscuro (default histórico de la app, "pizarra de gimnasio").
export const DARK_COLORS = {
  bg: '#000000',
  surface: '#1C1C1E',
  surfaceRaised: '#2C2C2E',
  chalk: '#FFFFFF',
  chalkDim: '#8E8E93',
  hazard: '#FA114F',
  hazardDim: '#4A0F22',
  brass: '#A2E834',
  stand: '#0AF6F1',
  line: 'rgba(255,255,255,0.09)',
};

// Tema claro: mismos roles de color, ajustados para contraste sobre fondo blanco
// (el brass/stand originales son muy claros para leerse sobre blanco, se oscurecen acá).
export const LIGHT_COLORS = {
  bg: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceRaised: '#EDEDF2',
  chalk: '#1C1C1E',
  chalkDim: '#6E6E73',
  hazard: '#E11D48',
  hazardDim: '#FBD5DD',
  brass: '#4D7C0F',
  stand: '#0369A1',
  line: 'rgba(0,0,0,0.09)',
};

// Compat: código que todavía no pasó por useTheme() sigue viendo el oscuro de siempre.
export const COLORS = DARK_COLORS;
