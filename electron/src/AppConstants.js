const Game = {
  P4G: 'Persona 4 Golden',
  P5: 'Persona 5',
  P3F: 'Persona 3 FES',
  P4: 'Persona 4',
  KH3: 'Kingdom Hearts 3'
};

const Theme = {
  DefaultDark: {
    name: 'Default Dark',
    css: 'defaultDark'
  },
  DefaultLight: {
    name: 'Default Light',
    css: 'defaultLight'
  },
  PhosTeal: {
    name: 'Phos Teal',
    css: 'phos'
  },
  RoyalRed: {
    name: 'Royal Red',
    css: 'royal'
  },
  ClassicOrange: {
    name: 'Classic Orange',
    css: 'classic'
  }
};

const Themes = [
  Theme.DefaultDark,
  Theme.DefaultLight,
  Theme.PhosTeal,
  Theme.RoyalRed,
  Theme.ClassicOrange
];

module.exports = { Game, Theme, Themes };
