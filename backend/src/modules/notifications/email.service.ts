import nodemailer, { Transporter } from "nodemailer";
import { logInfo, logWarn, logError } from "../../utils/Logger";

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

export class EmailService {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const config = this.loadConfig();
    if (!config) {
      logWarn("SMTP no configurado: el envío de correos está deshabilitado");
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    return this.transporter;
  }

  private loadConfig(): SmtpConfig | null {
    const host = process.env["SMTP_HOST"];
    const user = process.env["SMTP_USER"];
    const pass = process.env["SMTP_PASS"];

    if (!host || !user || !pass) return null;

    return {
      host,
      port: Number(process.env["SMTP_PORT"]) || 587,
      user,
      pass,
      from: process.env["SMTP_FROM"] || `Clinisalud <${user}>`,
    };
  }

  public async verifyConnection(): Promise<void> {
    const transporter = this.getTransporter();
    if (!transporter) return;

    try {
      await transporter.verify();
      logInfo("SMTP configurado y conexión verificada correctamente");
    } catch (error: any) {
      logError("SMTP configurado pero la conexión falló", { error: error.message });
    }
  }

  public async sendTemporaryPassword(to: string, name: string, tempPassword: string): Promise<void> {
    const transporter = this.getTransporter();
    if (!transporter) return;

    const subject = "Clinisalud - Tu contraseña temporal de acceso";
    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e3a5f; margin: 0 0 16px;">Hola, ${name}</h2>
        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Se ha creado tu cuenta de acceso al sistema <strong>Clinisalud</strong>.
          Estas son tus credenciales temporales:
        </p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Correo electrónico</p>
          <p style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: #0f172a;">${to}</p>
          <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Contraseña temporal</p>
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: #1d4ed8; letter-spacing: 1px;">${tempPassword}</p>
        </div>
        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Por seguridad, <strong>deberás cambiar esta contraseña en tu primer ingreso</strong>,
          desde el menú de tu perfil (opción "¿Desea cambiar contraseña?").
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          Si no solicitaste esta cuenta, ignora este correo.
        </p>
      </div>
    `;

    const text = [
      `Hola, ${name}`,
      "",
      "Se ha creado tu cuenta de acceso al sistema Clinisalud.",
      "",
      `Correo electrónico: ${to}`,
      `Contraseña temporal: ${tempPassword}`,
      "",
      "Por seguridad, deberás cambiar esta contraseña en tu primer ingreso, desde el menú de tu perfil.",
      "",
      "Si no solicitaste esta cuenta, ignora este correo.",
    ].join("\n");

    try {
      await transporter.sendMail({
        from: this.loadConfig()!.from,
        to,
        subject,
        html,
        text,
      });
      logInfo(`Contraseña temporal enviada a ${to}`);
    } catch (error: any) {
      logError(`Fallo al enviar contraseña temporal a ${to}`, { error: error.message });
      throw error;
    }
  }
}
