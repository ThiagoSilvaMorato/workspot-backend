export function buildPasswordResetEmail(resetUrl: string, expiresInMinutes: number): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir sua senha - WorkSpot</title>
</head>
<body style="margin:0;padding:0;background-color:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#fafafa;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:480px;background:#FFFFFF;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #e4e4e7;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#18181b;letter-spacing:-0.3px;">
                WorkSpot
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <h2 style="margin:0 0 12px;font-size:18px;font-weight:600;color:#18181b;">
                Redefinição de senha
              </h2>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#52525b;">
                Recebemos uma solicitação para redefinir a senha da sua conta WorkSpot.
                Clique no botão abaixo para criar uma nova senha.
              </p>
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="border-radius:8px;background-color:#3e6440;">
                    <a href="${resetUrl}"
                       style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;
                              color:#FFFFFF;text-decoration:none;border-radius:8px;letter-spacing:0.1px;">
                      Redefinir senha
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;color:#52525b;font-style:italic;">
                Este link expira em ${expiresInMinutes} minutos.
                Se você não solicitou a redefinição de senha, ignore este email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #e4e4e7;">
              <p style="margin:0;font-size:12px;color:#71717a;line-height:1.5;">
                WorkSpot — Plataforma para descobrir espaços de trabalho remoto.<br>
                Por segurança, nunca compartilhamos sua senha.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
