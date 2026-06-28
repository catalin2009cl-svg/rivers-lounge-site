export const PERMISSIONS = {
  // Dashboard
  'dashboard.view': ['admin', 'manager', 'operator'],

  // Comenzi
  'comenzi.view':   ['admin', 'manager', 'operator'],
  'comenzi.status': ['admin', 'manager', 'operator'],
  'comenzi.note':   ['admin', 'manager', 'operator'],
  'comenzi.delete': ['admin'],
  'comenzi.export': ['admin', 'manager'],

  // Rezervări
  'rezervari.view':   ['admin', 'manager', 'operator'],
  'rezervari.status': ['admin', 'manager', 'operator'],
  'rezervari.note':   ['admin', 'manager', 'operator'],
  'rezervari.delete': ['admin'],

  // Meniu
  'meniu.view':   ['admin', 'manager'],
  'meniu.edit':   ['admin', 'manager'],
  'meniu.delete': ['admin'],
  'meniu.create': ['admin', 'manager'],

  // Meniu Zilei
  'meniu-zilei.view': ['admin', 'manager'],
  'meniu-zilei.edit': ['admin', 'manager'],

  // Noutăți
  'noutati.view':    ['admin', 'manager'],
  'noutati.edit':    ['admin', 'manager'],
  'noutati.delete':  ['admin'],
  'noutati.create':  ['admin', 'manager'],
  'noutati.publish': ['admin', 'manager'],

  // Evenimente
  'evenimente.view':   ['admin', 'manager'],
  'evenimente.edit':   ['admin', 'manager'],
  'evenimente.delete': ['admin'],
  'evenimente.create': ['admin', 'manager'],

  // Pachete Cabana
  'cabana.view':   ['admin', 'manager'],
  'cabana.edit':   ['admin', 'manager'],
  'cabana.delete': ['admin'],

  // Media
  'media.view':   ['admin', 'manager'],
  'media.upload': ['admin', 'manager'],
  'media.delete': ['admin'],

  // Setări site
  'setari.view': ['admin'],
  'setari.edit': ['admin'],

  // Utilizatori & Operatori
  'utilizatori.view':   ['admin', 'manager'],
  'utilizatori.edit':   ['admin'],
  'utilizatori.delete': ['admin'],
  'operatori.view':     ['admin', 'manager'],
  'operatori.create':   ['admin'],
  'operatori.edit':     ['admin'],
  'operatori.delete':   ['admin'],

  // Arhivă & Rapoarte
  'arhiva.view':    ['admin', 'manager'],
  'rapoarte.view':  ['admin', 'manager'],
  'rapoarte.export':['admin', 'manager'],

  // Social Media
  'social.view': ['admin', 'manager'],
  'social.edit': ['admin', 'manager'],

  // Popup promoțional
  'popup.view': ['admin', 'manager'],
  'popup.edit': ['admin', 'manager'],

  // GDPR
  'gdpr.view':    ['admin'],
  'gdpr.process': ['admin'],

  // Mentenanță
  'mentenanta.view': ['admin'],
  'mentenanta.edit': ['admin'],

  // Recenzii
  'recenzii.view':   ['admin', 'manager'],
  'recenzii.edit':   ['admin', 'manager'],
  'recenzii.delete': ['admin'],

  // Verificare utilizatori
  'utilizatori.verify': ['admin'],

  // Program Loialitate
  'loialitate.view': ['admin', 'manager'],
  'loialitate.edit': ['admin'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: string, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}
