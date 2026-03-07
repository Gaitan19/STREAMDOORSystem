using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using STREAMDOORSystem.Data;
using STREAMDOORSystem.Models.DTOs;
using STREAMDOORSystem.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace STREAMDOORSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuthService _authService;
        private readonly IEmailService _emailService;

        public AuthController(ApplicationDbContext context, IAuthService authService, IEmailService emailService)
        {
            _context = context;
            _authService = authService;
            _emailService = emailService;
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDTO>> Login([FromBody] LoginDTO loginDto)
        {
            var usuario = await _context.Usuarios
                .Include(u => u.Rol!)
                    .ThenInclude(r => r.Permisos)
                .FirstOrDefaultAsync(u => u.Correo == loginDto.Correo && u.Activo);

            if (usuario == null || !_authService.VerifyPassword(loginDto.Password, usuario.PasswordHash))
            {
                return Unauthorized(new { message = "Credenciales inválidas" });
            }

            var token = _authService.GenerateJwtToken(usuario);

            var permisos = usuario.Rol?.Permisos.Select(p => new PermisoDTO
            {
                Modulo = p.Modulo,
                PuedeVer = p.PuedeVer,
                PuedeCrear = p.PuedeCrear,
                PuedeEditar = p.PuedeEditar,
                PuedeEliminar = p.PuedeEliminar
            }).ToList() ?? new List<PermisoDTO>();

            var response = new LoginResponseDTO
            {
                UsuarioID = usuario.UsuarioID,
                Nombre = usuario.Nombre,
                Correo = usuario.Correo,
                RolID = usuario.RolID,
                RolNombre = usuario.Rol?.Nombre,
                Permisos = permisos
            };

            // Configurar cookie HttpOnly – el token no se expone en el cuerpo de la respuesta
            Response.Cookies.Append("authToken", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddHours(24)
            });

            return Ok(response);
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("authToken");
            return Ok(new { message = "Sesión cerrada exitosamente" });
        }

        [HttpGet("verify")]
        public IActionResult VerifyToken()
        {
            var token = Request.Cookies["authToken"];
            if (string.IsNullOrEmpty(token))
            {
                return Unauthorized();
            }
            return Ok(new { authenticated = true });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult> GetCurrentUser()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var usuario = await _context.Usuarios
                .Include(u => u.Rol!)
                    .ThenInclude(r => r.Permisos)
                .FirstOrDefaultAsync(u => u.UsuarioID == userId && u.Activo);

            if (usuario == null)
                return NotFound();

            var permisos = usuario.Rol?.Permisos.Select(p => new PermisoDTO
            {
                Modulo = p.Modulo,
                PuedeVer = p.PuedeVer,
                PuedeCrear = p.PuedeCrear,
                PuedeEditar = p.PuedeEditar,
                PuedeEliminar = p.PuedeEliminar
            }).ToList() ?? new List<PermisoDTO>();

            return Ok(new
            {
                UsuarioID = usuario.UsuarioID,
                Nombre = usuario.Nombre,
                Correo = usuario.Correo,
                RolID = usuario.RolID,
                RolNombre = usuario.Rol?.Nombre,
                Permisos = permisos
            });
        }

        [HttpPost("recover-password")]
        public async Task<IActionResult> RecoverPassword([FromBody] RecoverPasswordDTO recoverDto)
        {
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Correo == recoverDto.Correo && u.Activo);

            if (usuario == null)
            {
                return NotFound(new { message = "No existe un usuario activo con ese correo electrónico" });
            }

            // Generate 10-character temporary password
            var temporaryPassword = GenerateTemporaryPassword();
            
            // Update password in database
            usuario.PasswordHash = _authService.HashPassword(temporaryPassword);
            await _context.SaveChangesAsync();

            // Send email with temporary password
            var emailSent = await _emailService.SendPasswordResetEmailAsync(
                usuario.Correo, 
                usuario.Nombre, 
                temporaryPassword
            );

            if (!emailSent)
            {
                return StatusCode(500, new { message = "Error al enviar el correo de recuperación. Contacte al administrador." });
            }

            return Ok(new { message = "Se ha enviado una contraseña temporal a tu correo electrónico" });
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDTO changePasswordDto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            var usuario = await _context.Usuarios.FindAsync(userId);
            if (usuario == null)
            {
                return NotFound(new { message = "Usuario no encontrado" });
            }

            // Verify old password
            if (!_authService.VerifyPassword(changePasswordDto.OldPassword, usuario.PasswordHash))
            {
                return BadRequest(new { message = "La contraseña anterior es incorrecta" });
            }

            // Update to new password
            usuario.PasswordHash = _authService.HashPassword(changePasswordDto.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Contraseña actualizada exitosamente" });
        }

        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            var usuario = await _context.Usuarios
                .Where(u => u.UsuarioID == userId && u.Activo)
                .Select(u => new
                {
                    u.UsuarioID,
                    u.Nombre,
                    u.Correo,
                    u.Telefono,
                    u.FechaCreacion
                })
                .FirstOrDefaultAsync();

            if (usuario == null)
            {
                return NotFound(new { message = "Usuario no encontrado" });
            }

            return Ok(usuario);
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDTO updateDto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            var usuario = await _context.Usuarios.FindAsync(userId);
            if (usuario == null)
            {
                return NotFound(new { message = "Usuario no encontrado" });
            }

            usuario.Nombre = updateDto.Nombre;
            usuario.Telefono = updateDto.Telefono;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Perfil actualizado exitosamente" });
        }

        private string GenerateTemporaryPassword()
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, 10)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }
    }
}
