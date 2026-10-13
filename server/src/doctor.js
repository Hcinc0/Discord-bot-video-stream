import { generateDependencyReport } from '@discordjs/voice';
import { toolsStatus } from './media.js';

console.log('Hcinco Discord Voice dependency report');
console.log(generateDependencyReport());
console.log('\nMedia tools:');
console.log(await toolsStatus());
