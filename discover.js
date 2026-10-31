import { discover } from './register.js'

const cat = process.argv.find(a => a === '--cat' || a.startsWith('--cat='))
const value = !cat ? 'general' : cat.includes('=') ? cat.slice('--cat='.length) : process.argv[process.argv.indexOf(cat) + 1]

discover(value).then(rows => {
  for (const row of rows) console.log(`${row.name}\t${row.repo}`)
  console.error(`[reg] found ${rows.length}`)
}).catch(err => {
  console.error(err.message || err)
  process.exit(1)
})
