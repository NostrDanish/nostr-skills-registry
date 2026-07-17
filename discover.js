import { discover } from './register.js';
const cat = process.argv.find(a=>a.startsWith('--cat'))?.split('=')[1] || 'AI/DVM';
discover(cat);
