import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { email, username, password } = createUserDto;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('User with this email already exists');
      }
      if (existingUser.username === username) {
        throw new ConflictException('User with this username already exists');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });

    return this.mapToResponseDto(user);
  }

  async findAll(pagination: PaginationDto): Promise<{ users: UserResponseDto[]; total: number }> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { rating: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      users: users.map(user => this.mapToResponseDto(user)),
      total,
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapToResponseDto(user);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const { password, ...updateData } = updateUserDto;

    await this.findOne(id);
    if (updateData.email || updateData.username) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                updateData.email ? { email: updateData.email } : {},
                updateData.username ? { username: updateData.username } : {},
              ].filter(condition => Object.keys(condition).length > 0),
            },
          ],
        },
      });

      if (existingUser) {
        if (existingUser.email === updateData.email) {
          throw new ConflictException('User with this email already exists');
        }
        if (existingUser.username === updateData.username) {
          throw new ConflictException('User with this username already exists');
        }
      }
    }

    const updatePayload: any = { ...updateData };
    if (password) {
      updatePayload.password = await bcrypt.hash(password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updatePayload,
    });

    return this.mapToResponseDto(user);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
  }

  async getTopPlayers(limit: number = 10): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      take: limit,
      orderBy: { rating: 'desc' },
    });

    return users.map(user => this.mapToResponseDto(user));
  }

  async updateRating(userId: string, newRating: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { rating: newRating },
    });
  }

  private mapToResponseDto(user: any): UserResponseDto {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}