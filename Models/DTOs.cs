namespace STREAMDOORSystem.Models.DTOs
{
    // DTOs de Autenticación
    public class LoginDTO
    {
        public string Correo { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LoginResponseDTO
    {
        public int UsuarioID { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
    }

    // DTOs de Usuario
    public class UsuarioDTO
    {
        public int UsuarioID { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string? Telefono { get; set; }
        public DateTime FechaCreacion { get; set; }
        public bool Activo { get; set; }
    }

    public class CrearUsuarioDTO
    {
        public string Nombre { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string? Telefono { get; set; }
        public string Password { get; set; } = string.Empty;
    }

    // DTOs de Cliente
    public class ClienteDTO
    {
        public int ClienteID { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? SegundoNombre { get; set; }
        public string Apellido { get; set; } = string.Empty;
        public string? SegundoApellido { get; set; }
        public string Telefono { get; set; } = string.Empty;
        public DateTime FechaRegistro { get; set; }
        public bool Activo { get; set; }
    }

    public class CrearClienteDTO
    {
        public string Nombre { get; set; } = string.Empty;
        public string? SegundoNombre { get; set; }
        public string Apellido { get; set; } = string.Empty;
        public string? SegundoApellido { get; set; }
        public string Telefono { get; set; } = string.Empty;
    }

    // DTOs de Servicio
    public class ServicioDTO
    {
        public int ServicioID { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public decimal? Precio { get; set; }
        public bool Activo { get; set; }
    }

    public class CrearServicioDTO
    {
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public decimal? Precio { get; set; }
    }

    // DTOs de Correo
    public class CorreoDTO
    {
        public int CorreoID { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public DateTime FechaCreacion { get; set; }
        public string? Notas { get; set; }
        public bool Activo { get; set; }
        public string? ServiciosAsociados { get; set; }
    }

    public class CrearCorreoDTO
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? Notas { get; set; }
        public List<int>? ServiciosIDs { get; set; }
    }

    // DTOs de Cuenta
    public class CuentaDTO
    {
        public int CuentaID { get; set; }
        public int ServicioID { get; set; }
        public string NombreServicio { get; set; } = string.Empty;
        public int? CorreoID { get; set; }
        public string? Email { get; set; }
        public string TipoCuenta { get; set; } = string.Empty;
        public int NumeroPerfiles { get; set; }
        public int PerfilesDisponibles { get; set; }
        public string Estado { get; set; } = string.Empty;
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaFinalizacion { get; set; }
        public string? Password { get; set; }
        public string? CorreoTerceros { get; set; }
        public string? CodigoCuenta { get; set; }
    }

    public class CrearCuentaDTO
    {
        public int ServicioID { get; set; }
        public int? CorreoID { get; set; }
        public string TipoCuenta { get; set; } = "Propia";
        public int NumeroPerfiles { get; set; } = 1;
        public DateTime? FechaFinalizacion { get; set; }
        public string? Email { get; set; }  // For TipoCuenta "Terceros" (auto-creates Correo)
        public string? Password { get; set; }  // Account password (both Propia & Terceros)
        public string? CorreoTerceros { get; set; }  // Email for Terceros accounts
        public string? CodigoCuenta { get; set; }  // Auto-generated account code
        public List<PerfilDTO>? Perfiles { get; set; }
    }

    // DTOs de Perfil
    public class PerfilDTO
    {
        public int PerfilID { get; set; }
        public int CuentaID { get; set; }
        public int NumeroPerfil { get; set; }
        public string? PIN { get; set; }
        public string Estado { get; set; } = string.Empty;
        public bool Activo { get; set; }
    }

    public class CrearPerfilDTO
    {
        public int CuentaID { get; set; }
        public int NumeroPerfil { get; set; }
        public string? PIN { get; set; }
        public string Estado { get; set; } = "Disponible";
    }

    // DTOs de Medio de Pago
    public class MedioPagoDTO
    {
        public int MedioPagoID { get; set; }
        public string Tipo { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string? NumeroCuenta { get; set; }
        public string? Beneficiario { get; set; }
        public string Moneda { get; set; } = string.Empty;
        public bool Activo { get; set; }
        public DateTime FechaCreacion { get; set; }
    }

    public class CrearMedioPagoDTO
    {
        public string Tipo { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string? NumeroCuenta { get; set; }
        public string? Beneficiario { get; set; }
        public string Moneda { get; set; } = "C$";
    }

    // DTOs de Venta
    public class VentaDTO
    {
        public int VentaID { get; set; }
        public int ClienteID { get; set; }
        public string NombreCliente { get; set; } = string.Empty;
        public int CuentaID { get; set; }
        public string NombreServicio { get; set; } = string.Empty;
        public int? PerfilID { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public int Duracion { get; set; }
        public decimal Monto { get; set; }
        public string Moneda { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;
        public int DiasRestantes { get; set; }
    }

    public class CrearVentaDTO
    {
        public int ClienteID { get; set; }
        public int? CuentaID { get; set; }  // Opcional: si no se proporciona, usar ServicioID
        public int? ServicioID { get; set; }  // Usado si CuentaID no está presente
        public int? PerfilID { get; set; }
        public int? MedioPagoID { get; set; }  // Medio de pago usado
        public DateTime FechaInicio { get; set; }
        public int Duracion { get; set; }
        public decimal Monto { get; set; }
        public string Moneda { get; set; } = "C$";
        public string? Notas { get; set; }
    }

    public class RenovarVentaDTO
    {
        public int VentaID { get; set; }
        public int Duracion { get; set; }
    }

    // DTOs de Pago
    public class PagoDTO
    {
        public int PagoID { get; set; }
        public int VentaID { get; set; }
        public int MedioPagoID { get; set; }
        public string NombreMedioPago { get; set; } = string.Empty;
        public decimal Monto { get; set; }
        public string Moneda { get; set; } = string.Empty;
        public DateTime FechaPago { get; set; }
        public string? Referencia { get; set; }
        public string? Notas { get; set; }
    }

    public class CrearPagoDTO
    {
        public int VentaID { get; set; }
        public int MedioPagoID { get; set; }
        public decimal Monto { get; set; }
        public string Moneda { get; set; } = "C$";
        public string? Referencia { get; set; }
        public string? Notas { get; set; }
    }

    // DTOs de Dashboard
    public class DashboardMetricasDTO
    {
        public int TotalVentas { get; set; }
        public decimal TotalIngresos { get; set; }
        public int RenovacionesPendientes { get; set; }
        public List<ServicioMasVendidoDTO> ServiciosMasVendidos { get; set; } = new();
        public List<AlertaVencimientoDTO> AlertasVencimiento { get; set; } = new();
    }

    public class ServicioMasVendidoDTO
    {
        public string Nombre { get; set; } = string.Empty;
        public int Cantidad { get; set; }
    }

    public class AlertaVencimientoDTO
    {
        public int VentaID { get; set; }
        public string Cliente { get; set; } = string.Empty;
        public string Servicio { get; set; } = string.Empty;
        public DateTime FechaFin { get; set; }
        public int DiasRestantes { get; set; }
    }

    // DTO para generar correo y contraseña
    public class GenerarCredencialesDTO
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
