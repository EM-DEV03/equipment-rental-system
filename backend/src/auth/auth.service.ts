import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { ActivityLogService } from '../shared/activity-log.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario o contraseña inválidos');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Usuario o contraseña inválidos');
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    await this.activityLogService.log({
      action: 'LOGIN',
      entityName: 'users',
      entityId: user.id,
      actorName: user.fullName,
    });

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
      },
    };
  }

  async findDefaultUser() {
    const user = await this.userRepo.findOne({ where: { username: 'admin' } });
    if (!user) {
      throw new NotFoundException('No se encontró el usuario administrador');
    }

    return user;
  }

  async listUsers() {
    return this.userRepo.find({
      select: {
        id: true,
        fullName: true,
        username: true,
        role: true,
        isActive: true,
      },
      order: { fullName: 'ASC' },
    });
  }

  async createUser(payload: {
    fullName: string;
    username: string;
    password: string;
    role: 'ADMIN' | 'EMPLOYEE';
  }) {
    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = this.userRepo.create({
      fullName: payload.fullName,
      username: payload.username,
      passwordHash,
      role: payload.role,
      isActive: true,
    });

    const savedUser = await this.userRepo.save(user);

    await this.activityLogService.log({
      action: 'USER_CREATED',
      entityName: 'users',
      entityId: savedUser.id,
      actorName: savedUser.fullName,
    });

    return {
      id: savedUser.id,
      fullName: savedUser.fullName,
      username: savedUser.username,
      role: savedUser.role,
      isActive: savedUser.isActive,
    };
  }

  async updateUser(
    userId: string,
    payload: Partial<{
      fullName: string;
      username: string;
      password: string;
      role: 'ADMIN' | 'EMPLOYEE';
      isActive: boolean;
    }>,
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (payload.password) {
      user.passwordHash = await bcrypt.hash(payload.password, 10);
    }

    if (payload.fullName !== undefined) user.fullName = payload.fullName;
    if (payload.username !== undefined) user.username = payload.username;
    if (payload.role !== undefined) user.role = payload.role;
    if (payload.isActive !== undefined) user.isActive = payload.isActive;

    const savedUser = await this.userRepo.save(user);

    await this.activityLogService.log({
      action: 'USER_UPDATED',
      entityName: 'users',
      entityId: savedUser.id,
      actorName: savedUser.fullName,
    });

    return {
      id: savedUser.id,
      fullName: savedUser.fullName,
      username: savedUser.username,
      role: savedUser.role,
      isActive: savedUser.isActive,
    };
  }
}
