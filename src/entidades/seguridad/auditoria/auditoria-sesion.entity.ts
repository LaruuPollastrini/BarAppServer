import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/users.entity';

export enum TipoEventoSesion {
  Login = 'LOGIN',
  LoginFallido = 'LOGIN_FALLIDO',
  Logout = 'LOGOUT',
}

/**
 * Auditoría de sesiones: cada inicio de sesión (exitoso o fallido) y cada cierre de sesión.
 */
@Entity('auditoria_sesion')
export class AuditoriaSesion {
  @PrimaryGeneratedColumn()
  id!: number;

  // LOGIN | LOGIN_FALLIDO | LOGOUT
  @Column({ type: 'varchar', length: 20 })
  tipo!: string;

  // null cuando el login falló con un correo que no existe
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuarioId' })
  usuario!: User | null;

  // Correo con el que se intentó ingresar (sirve para los intentos fallidos)
  @Column({ type: 'varchar', length: 255 })
  correo!: string;

  // Motivo del fallo u otra información (ej. "Contraseña incorrecta")
  @Column({ type: 'varchar', length: 255, nullable: true })
  detalle!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  fecha!: Date;
}