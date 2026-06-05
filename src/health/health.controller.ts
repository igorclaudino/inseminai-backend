import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaIndicator: PrismaHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Application health check' })
  check() {
    return this.health.check([
      () => this.prismaIndicator.pingCheck('database', this.prisma),
    ]);
  }

  @Get('slides')
  @ApiOperation({ summary: 'Apresentação InseminAI' })
  slides(@Res() res: Response) {
    const file = path.join(__dirname, 'apresentacao.html');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(fs.readFileSync(file, 'utf-8'));
  }
}
