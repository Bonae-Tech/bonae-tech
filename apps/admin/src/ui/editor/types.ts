export type SectionId =
  | 'hero'
  | 'valueProp'
  | 'keyFigures'
  | 'about'
  | 'plans'
  | 'contact'
  | 'settings'
  | 'advanced';

export type RailTab = 'changes' | 'history';

export const NAV_ITEMS: [SectionId, string][] = [
  ['hero', 'Hero'],
  ['valueProp', 'Servicios'],
  ['keyFigures', 'DatosClave'],
  ['about', 'Sobre nosotras'],
  ['plans', 'CTA'],
  ['contact', 'Contacto'],
  ['settings', 'Configuración del sitio'],
  ['advanced', 'JSON avanzado'],
];
