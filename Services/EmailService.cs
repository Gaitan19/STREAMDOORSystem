using System.Net;
using System.Net.Mail;

namespace STREAMDOORSystem.Services
{
    public interface IEmailService
    {
        Task<bool> SendPasswordResetEmailAsync(string toEmail, string userName, string temporaryPassword);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<bool> SendPasswordResetEmailAsync(string toEmail, string userName, string temporaryPassword)
        {
            try
            {
                var fromEmail = _configuration["EmailSettings:FromEmail"];
                var smtpHost = _configuration["EmailSettings:SmtpHost"];
                var smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"] ?? "587");
                var smtpUsername = _configuration["EmailSettings:SmtpUsername"];
                var smtpPassword = _configuration["EmailSettings:SmtpPassword"];
                var appName = _configuration["AppSettings:AppName"] ?? "STREAMDOOR";

                using var smtpClient = new SmtpClient(smtpHost, smtpPort)
                {
                    EnableSsl = true,
                    Credentials = new NetworkCredential(smtpUsername, smtpPassword)
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(fromEmail!, $"{appName} - Sistema de Gestión"),
                    Subject = $"Recuperación de Contraseña - {appName}",
                    Body = GeneratePasswordResetEmailBody(userName, temporaryPassword, appName),
                    IsBodyHtml = true
                };

                mailMessage.To.Add(toEmail);

                await smtpClient.SendMailAsync(mailMessage);
                _logger.LogInformation($"Password reset email sent successfully to {toEmail}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending password reset email to {toEmail}");
                return false;
            }
        }

        private string GeneratePasswordResetEmailBody(string userName, string temporaryPassword, string appName = "STREAMDOOR")
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .container {{
            background-color: #f8f9fa;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .header {{
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 3px solid #2563eb;
        }}
        .logo {{
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }}
        .content {{
            padding: 30px 0;
        }}
        .password-box {{
            background-color: #fff;
            border: 2px solid #2563eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }}
        .password {{
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            letter-spacing: 2px;
            font-family: 'Courier New', monospace;
        }}
        .warning {{
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .warning-title {{
            font-weight: bold;
            color: #856404;
            margin-bottom: 8px;
        }}
        .footer {{
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 14px;
        }}
        .button {{
            display: inline-block;
            padding: 12px 30px;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
        }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <div class=""logo"">🎬 {appName}</div>
            <p style=""color: #6c757d; margin: 0;"">Sistema de Gestión de Streaming</p>
        </div>
        
        <div class=""content"">
            <h2 style=""color: #2563eb;"">Recuperación de Contraseña</h2>
            
            <p>Hola <strong>{userName}</strong>,</p>
            
            <p>Hemos recibido una solicitud para restablecer tu contraseña. A continuación encontrarás tu contraseña temporal:</p>
            
            <div class=""password-box"">
                <p style=""margin: 0; color: #6c757d; font-size: 14px;"">Contraseña Temporal</p>
                <p class=""password"">{temporaryPassword}</p>
            </div>
            
            <div class=""warning"">
                <div class=""warning-title"">⚠️ Importante:</div>
                <p style=""margin: 0;"">Esta es una <strong>contraseña temporal</strong>. Por motivos de seguridad, te recomendamos cambiarla inmediatamente después de iniciar sesión.</p>
            </div>
            
            <h3 style=""color: #2563eb;"">Próximos pasos:</h3>
            <ol>
                <li>Inicia sesión con esta contraseña temporal</li>
                <li>Ve a tu perfil</li>
                <li>Cambia tu contraseña por una nueva y segura</li>
            </ol>
            
            <p><strong>Consejos para una contraseña segura:</strong></p>
            <ul>
                <li>Usa al menos 8 caracteres</li>
                <li>Combina letras mayúsculas y minúsculas</li>
                <li>Incluye números y símbolos</li>
                <li>No uses información personal obvia</li>
            </ul>
        </div>
        
        <div class=""footer"">
            <p>Si no solicitaste este cambio de contraseña, por favor contacta con soporte inmediatamente.</p>
            <p style=""margin-top: 20px;"">© 2024 {appName}. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>";
        }
    }
}
