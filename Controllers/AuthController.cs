using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using STREAMDOORSystem.Data;
using STREAMDOORSystem.Models.DTOs;
using STREAMDOORSystem.Services;

namespace STREAMDOORSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuthService _authService;

        public AuthController(ApplicationDbContext context, IAuthService authService)
        {
            _context = context;
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDTO>> Login([FromBody] LoginDTO loginDto)
        {
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Correo == loginDto.Correo && u.Activo);

            if (usuario == null || !_authService.VerifyPassword(loginDto.Password, usuario.PasswordHash))
            {
                return Unauthorized(new { message = "Credenciales inválidas" });
            }

            var token = _authService.GenerateJwtToken(usuario);

            var response = new LoginResponseDTO
            {
                UsuarioID = usuario.UsuarioID,
                Nombre = usuario.Nombre,
                Correo = usuario.Correo,
                Token = token
            };

            // Configurar cookie HttpOnly
            Response.Cookies.Append("authToken", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
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
    }
}
