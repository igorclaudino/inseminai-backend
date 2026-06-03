import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;
    const userId = (req as any).user?.id ?? 'anonymous';
    const start = Date.now();

    this.logger.log(`→ ${method} ${url} — user: ${userId}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<Response>();
          this.logger.log(`← ${method} ${url} — ${res.statusCode} — ${Date.now() - start}ms`);
        },
        error: (err: any) => {
          const status = err.status ?? 500;
          this.logger.error(`← ${method} ${url} — ${status} — ${Date.now() - start}ms — ${err.message}`);
        },
      }),
    );
  }
}
