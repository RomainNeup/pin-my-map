import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';

interface MongoServerLikeError {
  name?: string;
  code?: number;
  keyValue?: Record<string, unknown>;
  message?: string;
}

function isMongoDuplicateKeyError(err: unknown): err is MongoServerLikeError {
  if (!err || typeof err !== 'object') return false;
  const e = err as MongoServerLikeError;
  return (
    (e.name === 'MongoServerError' || e.name === 'MongoError') &&
    e.code === 11000
  );
}

/**
 * Global exception filter:
 * - Adds a `requestId` to every error response for log correlation.
 * - Maps Mongo duplicate-key errors (11000) to 409 Conflict.
 * - Returns generic message for unknown errors in production; raw message in dev.
 * - Logs every non-2xx response with structured context.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: Record<string, unknown> = {
      statusCode: status,
      message: 'Internal server error',
      requestId,
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      if (typeof resp === 'string') {
        body = { statusCode: status, message: resp, requestId };
      } else if (resp && typeof resp === 'object') {
        body = { ...(resp as Record<string, unknown>), requestId };
      }
    } else if (isMongoDuplicateKeyError(exception)) {
      status = HttpStatus.CONFLICT;
      const fields = Object.keys(exception.keyValue ?? {});
      body = {
        statusCode: status,
        message:
          fields.length > 0
            ? `Duplicate value for unique field(s): ${fields.join(', ')}`
            : 'Duplicate value violates a unique constraint',
        error: 'Conflict',
        requestId,
      };
    } else {
      const isDev = process.env.NODE_ENV !== 'production';
      const rawMessage =
        exception instanceof Error ? exception.message : 'Unknown error';
      body = {
        statusCode: status,
        message: isDev ? rawMessage : 'Internal server error',
        requestId,
      };
    }

    const stack = exception instanceof Error ? exception.stack : undefined;
    const logMeta = `[${requestId}] ${request.method} ${request.url} → ${status}`;
    if (status >= 500) {
      this.logger.error(
        `${logMeta} ${(body as { message?: string }).message ?? ''}`,
        stack,
      );
    } else {
      this.logger.warn(
        `${logMeta} ${(body as { message?: string }).message ?? ''}`,
      );
    }

    response.status(status).json(body);
  }
}
