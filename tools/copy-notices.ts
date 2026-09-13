import { copyFileSync,mkdirSync } from 'node:fs';
mkdirSync('dist/licenses',{recursive:true});
copyFileSync('LICENSE','dist/LICENSE');
copyFileSync('THIRD_PARTY_NOTICES.md','dist/THIRD_PARTY_NOTICES.md');
for(const name of ['three.txt','zod.txt','dm-sans.txt','libre-caslon-display.txt'])copyFileSync(`licenses/${name}`,`dist/licenses/${name}`);
console.log('Runtime and font license notices included in dist.');
