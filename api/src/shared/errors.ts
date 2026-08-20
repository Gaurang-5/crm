import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export class AppError extends Error {
  constructor(public code: string, public message: string, public status: number = 400) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const traceId = crypto.randomUUID();
  console.error(`[Error ${traceId}]`, err);

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, traceId }
    });
  }

  // Handle express body-parser entity too large
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request payload too large', traceId }
    });
  }

  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', traceId }
  });
}

export function notFoundHandler(req: Request, res: Response) {
  const traceId = crypto.randomUUID();
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Resource not found', traceId }
  });
}
