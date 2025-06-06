import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('certificates')
@UseGuards(JwtAuthGuard)
export class CertificatesController {
  @Get()
  getCertificates(@Req() req) {
    return { certificates: [], message: "Certificates endpoint stub" };
  }
} 