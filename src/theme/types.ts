export interface ThemeColors {
  background: {
    primary: string;
    secondary: string;
    darkVoid: string;
  };
  text: {
    primary: string;
    secondary: string;
    inverse: string;
  };
  brand: {
    primary: string;
  };
  status: {
    error: string;
    success: string;
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
  };
  cacheta: {
    win: string;
    fold: string;
    loss: string;
    playerCard: string;
    activeRound: string;
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
      regular: "400";
      bold: "700";
    };
  };
}