export interface LoginDto {
  correo: string;
  contrasena: string;
}

export interface RegisterDto {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
  telefono: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequestDto {
  correo: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    nombre: string;
    apellido: string;
    correo: string;
    telefono: string;
    estaActivo: boolean;
    modulosAccesibles: string[];
  };
}
