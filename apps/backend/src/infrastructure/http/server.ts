import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { env } from '../config/env';
import { authRouter } from './routes/auth.routes';

export function startServer() {
  const app = express();

  // credentials: true -> el navegador acepta/envía la cookie de sesión
  // en requests cross-origin desde el frontend (fetch con include).
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);

  app.listen(env.PORT, () => {
    console.log(`API escuchando en http://localhost:${env.PORT}`);
  });
}
