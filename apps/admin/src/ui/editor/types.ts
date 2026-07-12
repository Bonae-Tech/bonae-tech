export type SectionId =
  | 'hero'
  | 'valueProp'
  | 'keyFigures'
  | 'about'
  | 'contact'
  | 'settings'
  | 'advanced';

export type RailTab = 'changes' | 'history';

export const NAV_ITEMS: [SectionId, string][] = [
  ['hero', 'Hero'],
  ['valueProp', 'Services / value prop'],
  ['keyFigures', 'DatosClave'],
  ['about', 'About / team'],
  ['contact', 'Contact'],
  ['settings', 'Site settings'],
  ['advanced', 'Advanced JSON'],
];
