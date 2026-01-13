import { palette } from './colors';
import { Theme } from './types';

export const lightTheme: Theme = {
  colors: {
    background: {
      primary: palette.white,       // Fundo padrão de telas (Configurações, Sobre)
      secondary: palette.gray100,   // Fundo de cards ou listas
      darkVoid: palette.deepBlueVoid, // Mantemos o void disponível mesmo no light
    },
    text: {
      primary: palette.gray900,     // Texto principal PRETO (para ler no fundo branco)
      secondary: palette.gray800,   // Texto secundário cinza escuro
      inverse: palette.white,       // Texto para botões escuros
    },
    brand: {
      primary: palette.blue500,
    },
    status: {
      error: palette.red500,
      success: palette.green500,
    },
    neon: {
      primary: palette.cyanNeon,
      secondary: palette.purpleNeon,
      glow: palette.cyanGlow,
    },
    home: {
      title: palette.white,         // Título da Home continua branco
      titleOutline: palette.brownDark,
      buttonBackground: palette.orangePrimary,
      buttonBorder: palette.orangeDark,
      titleBackground: palette.darkOverlay, // Fundo escuro atrás do título para contraste
    },
    icon: {
      primary: palette.gray900,     // Ícones escuros no fundo claro
      secondary: palette.gray800,
    },
    modal: {
      overlay: palette.darkOverlay,
      background: palette.white,
      divider: palette.gray100,
      buttonActive: palette.orangePrimary,
      buttonInactive: 'transparent',
      textActive: palette.white,
      textInactive: palette.gray900,
    },
    truco: {
      backgroundTop: palette.feltGreenLight,
      backgroundBottom: palette.black,
      scoreText: palette.goldAccent,
      scoreLabel: palette.white,
      buttonTruco: palette.cardRed,
      buttonRegular: palette.woodBrown,
      cardBackground: 'rgba(0,0,0,0.25)',
      handIndicatorBackground: 'rgba(0,0,0,0.3)',
      subtractButtonBackground: 'rgba(255, 59, 48, 0.2)',
      graphBarUs: palette.goldAccent,
      graphBarThem: palette.cardWhite,
      trophy: palette.goldAccent,
    },
    cacheta: {
      win: palette.green500,        // Ganhou
      fold: palette.yellowFold,     // Correu
      loss: palette.orangePrimary,  // Perdeu
      playerCard: 'rgba(255,255,255,0.05)',
      activeRound: 'rgba(0,240,255,0.1)', // Um leve brilho neon para a rodada ativa
    },
  },
  // Mantenha as definições de espaçamento/tipografia iguais ou importe de um common.ts
  spacing: {
    xs: 4, s: 8, m: 16, l: 24, xl: 32,
  },
  typography: {
    sizes: { title: 32, body: 16, caption: 12 },
    weights: { regular: "400", bold: "700" },
  },
};