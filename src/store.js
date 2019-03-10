import { loadable, sortBy } from './_custom.js'
import { Airtable } from 'src/airtable.js'
export const db = new Airtable('appXYZ123', 'keyXYZ123')

export const items = loadable(db, '<Table name>')
