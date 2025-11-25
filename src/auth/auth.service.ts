import {
  Injectable,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterAuthDto } from './dto/register.dto';
import { LoginAuthDto } from './dto/login.dto';
import { Payload } from '../common/interfaces/payload';
import { Role } from '../common/enums/roles.enums';
import * as jwt from 'jsonwebtoken';
import { config } from '../common/config/jwtConfig';

type TokenPayload = Omit<Payload, 'iat' | 'exp'>;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsuarioService,
  ) {}

  async register(body: RegisterAuthDto) {
    const userExists = await this.usersService.findByEmail(body.email);

    if (userExists) {
      await this.logsService.createFailureLog(
        'REGISTER_USER',
        undefined,
        `Intento de registro con email duplicado: ${body.email}`,
      );
      throw new HttpException('El correo ya está registrado', 400);
    }

    // Confirm passwords match
    if ((body as any).password !== (body as any).confirmPassword) {
      throw new HttpException('Las contraseñas no coinciden', 400);
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const newUser = await this.usersService.create({
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      password: hashedPassword,
      role: body.role ?? Role.USER,
    });

    await this.logsService.createSuccessLog(
      'REGISTER_USER',
      newUser.id,
      `Usuario registrado: ${newUser.email} con rol ${newUser.role}`,
    );

    const { password, ...result } = newUser;

    return result;
  }

  async login(body: LoginAuthDto) {
    const user = await this.usersService.findByEmailWithPassword(body.email);

    if (!user) {
      await this.logsService.createFailureLog(
        'LOGIN',
        undefined,
        `Intento de login con email inexistente: ${body.email}`,
      );
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const isPasswordValid = await bcrypt.compare(body.password, user.password);

    if (!isPasswordValid) {
      await this.logsService.createFailureLog(
        'LOGIN',
        user.id,
        `Intento de login con contraseña incorrecta: ${body.email}`,
      );
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.logsService.createSuccessLog(
      'LOGIN',
      user.id,
      `Usuario ${user.email} inició sesión exitosamente`,
    );

    const payload: TokenPayload = {
      id: user.id,
      role: user.role,
      email: user.email,
    };
    return {
      accessToken: this.generateToken(payload, 'auth'),
      refreshToken: this.generateToken(payload, 'refresh'),
    };
  }

  logout() {
    return { message: 'Sesión cerrada correctamente' };
  }

  generateToken(
    payload: TokenPayload,
    type: 'auth' | 'refresh' | 'reset',
  ): string {
    const secret: string = config[type].secret;
    const expiresIn: string = config[type].expiresIn;

    return jwt.sign(payload as object, secret, {
      expiresIn,
    } as jwt.SignOptions);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = jwt.verify(
        refreshToken,
        config.refresh.secret,
      ) as Payload;

      const user = await this.usersService.findByEmail(payload.email);

      if (!user) {
        throw new UnauthorizedException('Token inválido o expirado');
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const timeToExpire = (payload.exp - currentTime) / 60;

      const tokenPayload: TokenPayload = {
        id: user.id,
        role: user.role,
        email: payload.email,
      };

      if (timeToExpire < 20) {
        return {
          accessToken: this.generateToken(tokenPayload, 'auth'),
          refreshToken: this.generateToken(tokenPayload, 'refresh'),
        };
      }

      return {
        accessToken: this.generateToken(tokenPayload, 'auth'),
      };
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  getPayload(token: string, type: 'auth' | 'refresh' = 'auth'): Payload {
    return jwt.verify(token, config[type].secret) as Payload;
  }

  async sendPasswordResetEmail(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return;

    const token = this.generateToken({ email }, 'reset');

    const resetLink = `https://localhost:3000/api/auth/reset-password?token=${token}`;
    await this.mailService.send({
      to: email,
      subject: 'Recuperación de contraseña',
      html: `<p>Haz clic <a href="${resetLink}">aquí</a> para restablecer tu contraseña.</p>`,
    });
  }

  async validateToken(token: string) {
    try {
      const payload = jwt.verify(token, config.reset.secret) as Payload;
      return { valid: true, email: payload.email };
    } catch (error) {
      return { valid: false };
    }
  }
}
