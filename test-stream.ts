import { generateStreamToken } from './src/server/services/token.service';

const token = generateStreamToken({ fileId: '1a2b3c4d5e' });
console.log(token);
