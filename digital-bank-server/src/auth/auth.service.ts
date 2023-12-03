import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma/prisma.service';
import { SignInDTO } from './dto/signin-dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signIn({ email, password }: SignInDTO) {
    const client = await this.prisma.client.findUnique({ where: { email } });

    if (!client) {
      throw new UnauthorizedException();
    }

    const isValidPassword = await bcrypt.compare(
      password,
      client.password_hash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException();
    }

    const payload = { sub: client.id, username: client.name };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async getProfile(id: string) {
    const client = await this.prisma.client.findUniqueOrThrow({
      where: { id },
    });

    return { ...client, password_hash: undefined };
  }
}
