import {
  Injectable,
  UnauthorizedException,
  HttpException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterAuthDto } from './dto/register.dto';
import { LoginAuthDto } from './dto/login.dto';
import { Payload } from '../common/interfaces/payload';
import { Role } from '../common/enums/roles.enums';
import * as jwt from 'jsonwebtoken';
import { config } from '../common/config/jwtConfig';
import { UsersService } from '../users/users.service';

type TokenPayload = Omit<Payload, 'iat' | 'exp'>;

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(body: RegisterAuthDto) {
    try {
      const userExists = await this.usersService.findByEmail(body.email);
      if (userExists) {
        throw new HttpException('Email already registered', 400);
      }

      const pass = (body as any).password;
      const confirm = (body as any).confirmPassword;
      if (typeof pass === 'undefined' || typeof confirm === 'undefined') {
        throw new HttpException('Password and confirmPassword are required', 400);
      }
      if (String(pass).trim() !== String(confirm).trim()) {
        throw new HttpException('Passwords do not match', 400);
      }

      // debug: log attempt (do not include raw password/hash)
      // eslint-disable-next-line no-console
      console.debug('AuthService.register: attempt', {
        email: body.email,
        hasPassword: !!pass,
      });

      const hashedPassword = await bcrypt.hash(body.password, 10);

      const newUser = await this.usersService.create({
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        password: hashedPassword,
        role: Role.CUSTOMER,
      });

      const { password, ...result } = newUser as any;
      return result;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('AuthService.register: error', err?.message || err);
      throw err;
    }
  }

  async login(body: LoginAuthDto) {

    const user = await this.usersService.findByEmailWithPassword(body.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(
      body.password,
      (user as any).password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const resolvedId = user.id;
    if (!resolvedId) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: TokenPayload = {
      id: user.id,
      role: user.role,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    return {
      accessToken: this.generateToken(payload, 'auth'),
      refreshToken: this.generateToken(payload, 'refresh'),
      id: payload.id,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role,
    };
  }

  logout() {
    return { message: 'Logged out' };
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
        throw new UnauthorizedException('Invalid or expired token');
      }
      const tokenPayload: TokenPayload = {
        id: (user as any)._id.toString(),
        role: (user as any).role,
        email: (user as any).email,
        firstName: (user as any).firstName,
        lastName: (user as any).lastName,
      } as any;
      return {
        accessToken: this.generateToken(tokenPayload, 'auth'),
        refreshToken: this.generateToken(tokenPayload, 'refresh'),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  getPayload(token: string, type: 'auth' | 'refresh' = 'auth'): Payload {
    return jwt.verify(token, config[type].secret) as Payload;
  }

  async sendPasswordResetEmail(email: string) {
    // implementation omitted
  }

  async validateToken(
    token: string | undefined,
    type: 'auth' | 'refresh' | 'reset' = 'auth',
  ) {
    try {
      if (!token) return { valid: false };
      const payload = jwt.verify(token, config[type].secret) as Payload;
      return { valid: true, payload };
    } catch (error) {
      return { valid: false };
    }
  }
}
