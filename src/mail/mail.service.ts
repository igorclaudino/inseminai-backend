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
    return process.env.MAIL_FROM ?? 'InseminAI <noreply@insemiai.com>';
  }

  private layout(title: string, body: string): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:#1B4332;padding:24px 32px;">
            <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:-0.5px;">Insemin<span style="color:#ffffff;">AI</span></span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 32px;">
            <h1 style="margin:0 0 24px;font-size:28px;font-weight:700;color:#1B4332;">${title}</h1>
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
              Atenciosamente,<br>
              <strong style="color:#374151;">Equipe InseminAI</strong>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private button(url: string, label: string): string {
    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
        <tr><td align="center">
          <a href="${url}" style="display:inline-block;border:2px solid #1B4332;color:#1B4332;background:#ffffff;padding:14px 48px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;">${label}</a>
        </td></tr>
      </table>`;
  }

  private codeBlock(value: string): string {
    return `<span style="display:inline-block;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:4px;padding:6px 14px;font-family:monospace;font-size:18px;letter-spacing:1px;color:#111827;">${value}</span>`;
  }

  private text(content: string): string {
    return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#111827;">${content}</p>`;
  }

  private muted(content: string): string {
    return `<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#9ca3af;">${content}</p>`;
  }

  async sendTempPassword(params: { toEmail: string; name: string; tempPassword: string }) {
    this.logger.log(`[SENHA TEMP] Para: ${params.toEmail} | Senha: ${params.tempPassword}`);
    if (!this.transporter) return;

    const body =
      this.text(`Sua conta de administrador no <strong>InseminAI</strong> foi criada. Use as credenciais abaixo para o primeiro acesso:`) +
      this.text(`<strong>E-mail:</strong> ${params.toEmail}`) +
      this.text(`<strong>Senha temporária:</strong> ${this.codeBlock(params.tempPassword)}`) +
      this.text('Você será solicitado a definir uma nova senha no primeiro login.') +
      this.muted('Se você não reconhece este cadastro, entre em contato com o suporte.');

    await this.transporter.sendMail({
      from: this.from,
      to: params.toEmail,
      subject: 'InseminAI — Sua conta foi criada',
      html: this.layout(`Bem-vindo, ${params.name}!`, body),
    });
  }

  async sendPasswordReset(params: { toEmail: string; name: string; resetUrl: string }) {
    this.logger.log(`[RESET SENHA] Para: ${params.toEmail} | Link: ${params.resetUrl}`);
    if (!this.transporter) return;

    const body =
      this.text(`Olá, <strong>${params.name}</strong>! Recebemos uma solicitação para redefinir a senha da sua conta.`) +
      this.text('Clique no botão abaixo para criar uma nova senha:') +
      this.button(params.resetUrl, 'Redefinir Senha') +
      this.text('Este link é válido por <strong>1 hora</strong>.') +
      this.muted('Se você não solicitou a redefinição, ignore este e-mail — sua senha permanece a mesma.');

    await this.transporter.sendMail({
      from: this.from,
      to: params.toEmail,
      subject: 'InseminAI — Redefinição de senha',
      html: this.layout('Redefinição de Senha', body),
    });
  }

  async sendInvitationWithTempPassword(params: {
    toEmail: string;
    name: string;
    tempPassword: string;
    farmName: string;
    role: string;
  }) {
    const roleLabel = params.role === 'admin' ? 'Administrador' : 'Operador';
    this.logger.log(`[CONVITE+SENHA] Para: ${params.toEmail} | Fazenda: ${params.farmName} | Senha: ${params.tempPassword}`);
    if (!this.transporter) return;

    const body =
      this.text(`Você foi convidado para se juntar à <strong>${params.farmName}</strong> como <strong>${roleLabel}</strong>.`) +
      this.text('Sua conta foi criada. Use as credenciais abaixo para o primeiro acesso:') +
      this.text(`<strong>E-mail:</strong> ${params.toEmail}`) +
      this.text(`<strong>Senha temporária:</strong> ${this.codeBlock(params.tempPassword)}`) +
      this.text('Você será solicitado a definir uma nova senha no primeiro login.') +
      this.muted('Se você não reconhece este convite, ignore este e-mail.');

    await this.transporter.sendMail({
      from: this.from,
      to: params.toEmail,
      subject: `InseminAI — Você foi convidado para ${params.farmName}`,
      html: this.layout('Convite', body),
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
    this.logger.log(`[CONVITE] Para: ${params.toEmail} | Fazenda: ${params.farmName} | Perfil: ${roleLabel} | Link: ${params.acceptUrl}`);
    if (!this.transporter) return;

    const body =
      this.text(`<strong>${params.inviterName}</strong> convidou você para se juntar à <strong>${params.farmName}</strong> como <strong>${roleLabel}</strong>.`) +
      this.button(params.acceptUrl, 'Aceitar Convite') +
      this.muted('O convite expira em 7 dias. Se você não reconhece este convite, ignore este e-mail.');

    await this.transporter.sendMail({
      from: this.from,
      to: params.toEmail,
      subject: `InseminAI — Convite para ${params.farmName}`,
      html: this.layout('Convite', body),
    });
  }
}
