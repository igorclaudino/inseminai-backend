import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.MAIL_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_PORT ?? '587'),
        secure: process.env.MAIL_SECURE === 'true',
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      });
    }
  }

  private get from() {
    return process.env.MAIL_FROM ?? 'InsemiAI <noreply@insemiai.com>';
  }

  async sendTempPassword(params: { toEmail: string; name: string; tempPassword: string }) {
    this.logger.log(`[SENHA TEMP] Para: ${params.toEmail} | Senha: ${params.tempPassword}`);

    if (!this.transporter) return;

    const html = `
      <h2>Bem-vindo ao InsemiAI, ${params.name}!</h2>
      <p>Sua conta de administrador foi criada. Use as credenciais abaixo para o primeiro acesso:</p>
      <p><strong>E-mail:</strong> ${params.toEmail}</p>
      <p><strong>Senha temporária:</strong> <code style="font-size:18px;background:#f3f4f6;padding:4px 8px;border-radius:4px;">${params.tempPassword}</code></p>
      <p>Você será solicitado a definir uma nova senha no primeiro login.</p>
      <p style="color:#6b7280;font-size:12px;">Se você não reconhece este cadastro, entre em contato com o suporte.</p>
    `;

    await this.transporter.sendMail({
      from: this.from,
      to: params.toEmail,
      subject: 'InsemiAI — Sua conta foi criada',
      html,
    });
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
      from: this.from,
      to: params.toEmail,
      subject: `Convite para fazenda ${params.farmName} no InsemiAI`,
      html,
    });
  }
}
