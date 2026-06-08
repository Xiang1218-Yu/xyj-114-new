import express, { type Request, type Response } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import habitsRoutes from './routes/habits.js';
import checkinsRoutes from './routes/checkins.js';
import teamsRoutes from './routes/teams.js';
import leaderboardRoutes from './routes/leaderboard.js';
import usersRoutes from './routes/users.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { successResponse } from './utils/response.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app: express.Application = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/checkins', checkinsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', usersRoutes);

app.use('/api/health', (_req: Request, res: Response) => {
  successResponse(res, null, 'ok');
});

app.use(errorHandler);
app.use(notFoundHandler);

export default app;
