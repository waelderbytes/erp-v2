// Globaler Exception-Filter - Nutzerforderung 08.08.2026: beim Testen auf
// dem Server kam bei einem Fehler nur "Internal server error" ohne jede
// weitere Information an, obwohl der volle Fehler im Server-Log
// (docker compose logs erp-service) sichtbar ist. NestJS liefert bei NICHT
// erwarteten Fehlern (alles ausser den bewusst geworfenen BadRequest-/
// NotFound-/ConflictException etc.) standardmaessig absichtlich NUR "Internal
// server error" an den Client zurueck (Sicherheitsgrund: keine internen
// Details/Stacktraces nach aussen) - das Log allein reicht aber beim
// schnellen Durchklicken auf dem Testserver nicht.
//
// Debug-Modus ueber ENV-Var DEBUG_ERRORS (siehe docker-compose.yml, fuer den
// Testserver default 'true'): dann kommt Fehlermeldung + Stacktrace direkt
// in der HTTP-Antwort mit. Fuer echte Kunden-Deployments spaeter in der
// jeweiligen .env auf 'false' setzen (Fehlerdetails duerfen dort nicht nach
// aussen sichtbar sein - siehe DSGVO/Verfahrensdokumentation).
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

const DEBUG_ERRORS = process.env.DEBUG_ERRORS === 'true';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('UnbehandelteException');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Bewusst geworfene Nest-Exceptions (BadRequestException etc.) unveraendert
    // durchreichen - die enthalten schon eine sinnvolle Fehlermeldung.
    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    const fehler = exception instanceof Error ? exception : new Error(String(exception));
    // IMMER vollstaendig ins Server-Log, unabhaengig von DEBUG_ERRORS.
    this.logger.error(`${request.method} ${request.url} -> ${fehler.message}`, fehler.stack);

    const body: Record<string, unknown> = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: DEBUG_ERRORS ? fehler.message : 'Internal server error',
      path: request.url,
      timestamp: new Date().toISOString(),
    };
    if (DEBUG_ERRORS) {
      body.name = fehler.name;
      body.stack = fehler.stack?.split('\n');
    }
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}
