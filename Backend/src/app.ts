import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import apiRoutes from './routes';

const app = express();

// CORS configuration
app.use(
  cors({
    origin: '*', // Allow all origins for dev/POS/BackOffice
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check & Uptime Monitoring
app.get(['/', '/health', '/api/health'], (req: Request, res: Response) => {
  res.json({
    status: 'online',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Supermarket POS & Back Office API',
  });
});

// Main API routes
app.use('/api', apiRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API route '${req.method} ${req.originalUrl}' not found.`,
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Global Error]', err);
  const status = err.statusCode || 500;
  const message = err.message || 'An unexpected server error occurred. Please try again.';
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

export default app;
