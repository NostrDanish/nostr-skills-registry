import { discover, flag } from './register.js'

const cat = flag('--cat') || flag('--discover')
const rows = await discover(cat)
console.log(JSON.stringify(rows, null, 2))
console.error(`[reg] ${rows.length} skill(s)`)
