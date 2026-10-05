import type { SheetTemplate } from '../types'
import { actionPoolsTemplate } from './actionPools'
import { blankTemplate } from './blank'
import { fateTemplate } from './fate'
import { moves2d6Template } from './moves2d6'
import { threeD20Template } from './threeD20'

/** Templates that come with Fablesheet, in the order they are offered */
export const BUILTIN_TEMPLATES: readonly SheetTemplate[] = [
  fateTemplate,
  actionPoolsTemplate,
  moves2d6Template,
  threeD20Template,
  blankTemplate,
]
