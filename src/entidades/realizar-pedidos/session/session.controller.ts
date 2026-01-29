import { Body, Controller, Post } from '@nestjs/common';
import { SessionService } from './session.service';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  /**
   * POST /session/scan-table
   * Called when QR code is scanned
   * WHY: Generates visitToken if table is closed, or returns existing token if open
   */
  @Post('scan-table')
  async scanTable(@Body('numeroMesa') numeroMesa: number) {
    return this.sessionService.scanTable(numeroMesa);
  }

  /**
   * POST /session/validate
   * Validates existing session
   * WHY: Frontend calls this on page load to check if session is still valid
   */
  @Post('validate')
  async validateSession(
    @Body('sessionId') sessionId: string,
    @Body('visitToken') visitToken: string,
  ) {
    return this.sessionService.validateSession(sessionId, visitToken);
  }
}

