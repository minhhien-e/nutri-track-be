import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = exception instanceof HttpException ? exception.getResponse() : null;
    const message = this.extractMessage(payload, exception);

    response.status(status).json({
      success: false,
      error: {
        code: this.codeForStatus(status),
        message,
      },
    });
  }

  private extractMessage(payload: unknown, exception: unknown): string {
    if (typeof payload === 'object' && payload !== null && 'message' in payload) {
      const message = (payload as { message: string | string[] }).message;
      return Array.isArray(message) ? message.join(', ') : message;
    }
    if (exception instanceof Error) return exception.message;
    return 'Internal server error';
  }

  private codeForStatus(status: number): string {
    if (status === HttpStatus.BAD_REQUEST) return 'VALIDATION_ERROR';
    if (status === HttpStatus.UNAUTHORIZED) return 'UNAUTHORIZED';
    if (status === HttpStatus.NOT_FOUND) return 'NOT_FOUND';
    if (status === HttpStatus.CONFLICT) return 'CONFLICT';
    return 'INTERNAL_ERROR';
  }
}
