import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma/prisma.service';
import { SignInDTO } from './dto/signin-dto';
import * as dayjs from 'dayjs';

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

    const { accessToken, refreshToken, refreshTokenExpirationDate } =
      await this.generatePairOfTokens(client.id, client.name);

    await this.prisma.token.create({
      data: {
        token: refreshToken,
        exp: refreshTokenExpirationDate.toISOString(),
        client_id: client.id,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async getProfile(id: string) {
    const client = await this.prisma.client.findUniqueOrThrow({
      where: { id },
    });

    return { ...client, password_hash: undefined };
  }

  async refreshToken(refreshToken: string) {
    const databaseRefreshToken = await this.prisma.token.findFirst({
      where: { token: refreshToken },
    });

    if (!databaseRefreshToken) {
      throw new BadRequestException();
    }

    let currentDate = dayjs(new Date());
    let refreshTokenExpirationDate = dayjs(databaseRefreshToken.exp);
    let isTokenValid = currentDate.isBefore(refreshTokenExpirationDate);

    if (!isTokenValid) {
      await this.prisma.token.delete({
        where: { id: databaseRefreshToken.id },
      });
      throw new UnauthorizedException();
    }

    const client = await this.getProfile(databaseRefreshToken.client_id);

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await this.generatePairOfTokens(client.id, client.name);

    await this.prisma.token.update({
      where: { id: databaseRefreshToken.id },
      data: { token: newRefreshToken },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async generatePairOfTokens(id: string, name: string) {
    const payloadAccessToken = {
      type: 'access_token',
      sub: id,
      username: name,
    };
    const payloadRefreshToken = {
      type: 'refresh_token',
    };

    const accessToken = await this.jwtService.signAsync(payloadAccessToken);
    const refreshToken = await this.jwtService.signAsync(payloadRefreshToken, {
      expiresIn: '1s',
    });

    let refreshTokenExpirationDate = dayjs(new Date());
    refreshTokenExpirationDate = refreshTokenExpirationDate.add(30, 'day');

    return {
      accessToken,
      refreshToken,
      refreshTokenExpirationDate,
    };
  }
}
