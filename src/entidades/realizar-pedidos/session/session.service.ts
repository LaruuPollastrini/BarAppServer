import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './session.entity';
import { Mesa } from '../mesa/mesas.entity';
import * as crypto from 'crypto';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(Mesa)
    private mesaRepository: Repository<Mesa>,
  ) {}

  /**
   * Generates a secure random token for visit validation
   * WHY: Prevents unauthorized access even if someone knows the table number
   */
  private generateVisitToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generates a unique session ID for device identification
   * WHY: Each device needs a unique identifier to track sessions
   */
  private generateSessionId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Scans a table and generates/returns visitToken
   * WHY: This is called when QR code is scanned - generates new token if table is closed
   * or returns existing token if table is already open
   */
  async scanTable(numeroMesa: number): Promise<{ visitToken: string; sessionId: string }> {
    const mesa = await this.mesaRepository.findOneBy({ numero: numeroMesa });
    
    if (!mesa) {
      throw new BadRequestException('Mesa no encontrada');
    }

    // If table is closed or has no visitToken, generate a new one
    // WHY: Each visit (dining session) needs a fresh token
    if (!mesa.estaAbierta || !mesa.visitToken) {
      const newVisitToken = this.generateVisitToken();
      mesa.visitToken = newVisitToken;
      mesa.estaAbierta = true;
      await this.mesaRepository.save(mesa);

      // Invalidate all existing sessions for this table
      // WHY: Previous visit sessions should not be valid for new visit
      await this.sessionRepository.update(
        { mesa: { idmesa: mesa.idmesa } },
        { isActive: false },
      );
    }

    // Generate new sessionId for this device
    // WHY: Each device scanning the QR gets its own session
    const sessionId = this.generateSessionId();

    // Create session record
    const session = this.sessionRepository.create({
      sessionId,
      visitToken: mesa.visitToken,
      mesa,
      isActive: true,
    });
    await this.sessionRepository.save(session);

    return {
      visitToken: mesa.visitToken,
      sessionId,
    };
  }

  /**
   * Validates a session by checking sessionId and visitToken
   * WHY: Ensures the device session is still valid and matches current table visit
   */
  async validateSession(
    sessionId: string,
    visitToken: string,
  ): Promise<{ valid: boolean; visitToken?: string; mesaNumero?: number }> {
    const session = await this.sessionRepository.findOne({
      where: { sessionId },
      relations: ['mesa'],
    });

    if (!session) {
      return { valid: false };
    }

    // Check if session is active
    // WHY: Inactive sessions were invalidated (table closed or new visit started)
    if (!session.isActive) {
      return { valid: false };
    }

    // Check if table is still open
    // WHY: Closed tables should reject all orders
    if (!session.mesa.estaAbierta) {
      return { valid: false };
    }

    // Check if visitToken matches current table token
    // WHY: Token mismatch means table was closed/reopened (new visit started)
    if (session.visitToken !== session.mesa.visitToken) {
      return { valid: false };
    }

    // Update last activity timestamp
    // WHY: Track when session was last used (useful for cleanup)
    session.lastActivity = new Date();
    await this.sessionRepository.save(session);

    return {
      valid: true,
      visitToken: session.mesa.visitToken,
      mesaNumero: session.mesa.numero,
    };
  }

  /**
   * Invalidates all sessions for a table
   * WHY: Called when table is closed - prevents any further orders
   */
  async invalidateTableSessions(mesaId: number): Promise<void> {
    await this.sessionRepository.update(
      { mesa: { idmesa: mesaId } },
      { isActive: false },
    );
  }

  /**
   * Validates order request with sessionId and visitToken
   * WHY: Centralized validation logic for order endpoint
   */
  async validateOrderRequest(
    sessionId: string,
    visitToken: string,
    numeroMesa: number,
  ): Promise<void> {
    const validation = await this.validateSession(sessionId, visitToken);

    if (!validation.valid) {
      throw new UnauthorizedException('Sesión inválida o expirada');
    }

    // Double-check mesa number matches
    // WHY: Extra security layer - ensure session belongs to correct table
    if (validation.mesaNumero !== numeroMesa) {
      throw new UnauthorizedException('La sesión no corresponde a esta mesa');
    }
  }
}

