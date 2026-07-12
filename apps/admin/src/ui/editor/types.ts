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
  ['valueProp', 'Servicios'],
  ['keyFigures', 'Datos Clave'],
  ['about', 'Sobre nosotras'],
  ['contact', 'Contacto'],
  ['settings', 'Configuración del sitio'],
  ['advanced', 'JSON avanzado'],
];
