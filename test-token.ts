import { generateToken } from './src/server/controllers/video.controller';
import { Request, Response } from 'express';

const req = {
  body: { lessonId: 'some-lesson' },
  headers: { authorization: 'Bearer some-fake-token' }
} as any;

const res = {
  status: (code) => {
    console.log('STATUS:', code);
    return res;
  },
  json: (data) => {
    console.log('JSON:', data);
    return res;
  }
} as any;

generateToken(req, res).then(() => console.log('Done')).catch(console.error);
