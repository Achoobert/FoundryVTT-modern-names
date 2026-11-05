import { MODULE_ID } from './table-ids.js'

const ICON_PATH = `modules/${MODULE_ID}/assets/icons`

export const MODERN_STATUS_EFFECTS = [
  { id: 'drinking', name: 'Drinking', icon: 'drinking.svg' },
  { id: 'inebriated', name: 'Inebriated', icon: 'knockout.svg' },
  { id: 'high', name: 'High', icon: 'powder.svg' },
  { id: 'caffeinated', name: 'Caffeinated', icon: 'coffee-cup.svg' },
  { id: 'hungover', name: 'Hungover', icon: 'vomiting.svg' },
  { id: 'disguised', name: 'Disguised', icon: 'prank-glasses.svg' },
  { id: 'smoking', name: 'Smoking', icon: 'cigarette.svg' },
  { id: 'joint', name: 'Joint', icon: 'joint.svg' },
  { id: 'downers', name: 'Downers', icon: 'square-bottle.svg' },
  { id: 'medicated', name: 'Medicated', icon: 'pill.svg' },
  { id: 'cigar', name: 'Cigar', icon: 'cigar.svg' },
  { id: 'aroused', name: 'Aroused', icon: 'smitten.svg' }
]

/** Runs on `setup` so it lands after systems (e.g. CoC7) replace CONFIG.statusEffects. */
export function registerStatusEffects () {
  const existing = new Set(CONFIG.statusEffects.map(effect => effect.id))
  for (const { id, name, icon } of MODERN_STATUS_EFFECTS) {
    if (existing.has(id)) continue
    CONFIG.statusEffects.push({ id, name, img: `${ICON_PATH}/${icon}` })
  }
}
