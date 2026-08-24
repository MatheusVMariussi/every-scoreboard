export interface ThemeColors {
  background: {
    primary: string;
    secondary: string;
    darkVoid: string;
    overlay: string; // New: for generic overlays
  };
  text: {
    primary: string;
    secondary: string;
    inverse: string;
    white: string; // New: explicit white
    black: string; // New: explicit black
  };
  brand: {
    primary: string;
  };
  status: {
    error: string;
    success: string;
    warning: string; // New: for gold/yellow states
  };
  neon: {
    primary: string;
    secondary: string;
    glow: string;
  };
  home: {
    title: string;
    titleOutline: string;
    buttonBackground: string;
    buttonBorder: string;
    buttonSecondary: string; // New
    buttonSecondaryBorder: string; // New
    buttonDestructive: string; // New
    buttonDestructiveBorder: string; // New
    titleBackground: string;
  };
  icon: {
    primary: string;
    secondary: string;
  };
  modal: {
    overlay: string;
    background: string;
    divider: string;
    buttonActive: string;
    buttonInactive: string;
    textActive: string;
    textInactive: string;
  };
  truco: {
    backgroundTop: string;
    backgroundBottom: string;
    scoreText: string;
    scoreLabel: string;
    buttonTruco: string;
    buttonRegular: string;
    cardBackground: string;
    handIndicatorBackground: string;
    subtractButtonBackground: string;
    graphBarUs: string;
    graphBarThem: string;
    trophy: string;
    teamUs: string; // New
    teamThem: string; // New
    divider: string; // New
  };
  cacheta: {
    win: string;
    fold: string;
    loss: string;
    playerCard: string;
    activeRound: string;
    text: string; // New: for text inside cards
  };
  /**
   * Camada de voz. As telas de jogo são sempre feltro escuro, independente do tema,
   * então estes valores são iguais no claro e no escuro de propósito.
   */
  voice: {
    surface: string; // Pastilhas ancoradas no rodapé
    panel: string; // Painel da fila e modal de aviso
    border: string; // Contorno em repouso
    idle: string; // Ícone em repouso
    idleText: string; // Rótulos e texto secundário
    active: string; // Ouvindo (mesmo acento de "ATUAL")
    activeSoft: string;
    recording: string; // Modo sempre ouvindo
    recordingSoft: string;
  };
  fodinha: {
    cardBackground: string; // New
    damageText: string; // New
    safeDot: string; // New
    eliminated: string; // New
    divider: string; // New
    countColor: string; // New: for total counts
  };
}

export interface Theme {
  colors: ThemeColors;
  spacing: {
    xs: number;
    s: number;
    m: number;
    l: number;
    xl: number;
  };
  typography: {
    sizes: {
      title: number;
      body: number;
      caption: number;
    };
    weights: {
      regular: '400';
      bold: '700';
    };
  };
}
