import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT ?? '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async sendFarmInvitation(params: {
    toEmail: string;
    farmName: string;
    role: string;
    inviterName: string;
    acceptUrl: string;
  }) {
    const roleLabel = params.role === 'admin' ? 'Administrador' : 'Operador';

    this.logger.log(
      `[CONVITE] Para: ${params.toEmail} | Fazenda: ${params.farmName} | Perfil: ${roleLabel} | Link: ${params.acceptUrl}`,
    );

    if (!this.transporter) return;

    const html = `
      <h2>Você foi convidado para a fazenda <strong>${params.farmName}</strong></h2>
      <p>${params.inviterName} convidou você como <strong>${roleLabel}</strong>.</p>
      <p>Clique no link abaixo para aceitar o convite:</p>
      <p><a href="${params.acceptUrl}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Aceitar convite</a></p>
      <p style="color:#6b7280;font-size:12px;">O convite expira em 7 dias. Se você não reconhece este convite, ignore este e-mail.</p>
    `;

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'InsemiAI <noreply@insemiai.com>',
      to: params.toEmail,
      subject: `Convite para fazenda ${params.farmName} no InsemiAI`,
      html,
    });
  }
}
