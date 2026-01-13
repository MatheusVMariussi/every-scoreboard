import { palette } from './colors';
import { Theme } from './types';

export const darkTheme: Theme = {
  colors: {
    background: {
      primary: palette.gray900,     // Fundo padrão ESCURO (Configurações, etc)
      secondary: palette.gray800,   // Cards levemente mais claros
      darkVoid: palette.deepBlueVoid,
    },
    text: {
      primary: palette.white,       // Texto principal BRANCO
      secondary: palette.gray100,   // Texto secundário cinza claro
      inverse: palette.gray900,     // Texto para botões claros
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
      title: palette.white,
      titleOutline: palette.brownDark,
      buttonBackground: palette.orangePrimary,
      buttonBorder: palette.orangeDark,
      titleBackground: palette.darkOverlay,
    },
    icon: {
      primary: palette.white,       // Ícones brancos no fundo escuro
      secondary: palette.gray100,
    },
    modal: {
      overlay: palette.darkOverlay,
      background: palette.gray900,
      divider: palette.gray800,
      buttonActive: palette.orangePrimary,
      buttonInactive: 'transparent',
      textActive: palette.white,
      textInactive: palette.gray100, // <--- GARANTINDO QUE SEJA CLARO
    },
    truco: {
      backgroundTop: palette.feltGreenLight,
      backgroundBottom: palette.black, // Fade para preto fica elegante
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
  // Espaçamento e tipografia se mantêm
  spacing: {
    xs: 4, s: 8, m: 16, l: 24, xl: 32,
  },
  typography: {
    sizes: { title: 32, body: 16, caption: 12 },
    weights: { regular: "400", bold: "700" },
  },
};