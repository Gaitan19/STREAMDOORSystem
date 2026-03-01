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
        public string? Password { get; set; }
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
        public decimal? Costo { get; set; }
        public List<PerfilDTO>? Perfiles { get; set; }
        public bool Activo { get; set; }
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
        public decimal? Costo { get; set; }
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
        public string TelefonoCliente { get; set; } = string.Empty;
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public int? Duracion { get; set; }
        public decimal Monto { get; set; }
        public string Moneda { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;
        public int DiasRestantes { get; set; }
        public List<VentaDetalleDTO> Detalles { get; set; } = new();
    }

    public class VentaDetalleDTO
    {
        public int VentaDetalleID { get; set; }
        public int VentaID { get; set; }
        public int CuentaID { get; set; }
        public string CodigoCuenta { get; set; } = string.Empty;
        public int PerfilID { get; set; }
        public int NumeroPerfil { get; set; }
        public int ServicioID { get; set; }
        public string NombreServicio { get; set; } = string.Empty;
        public decimal PrecioUnitario { get; set; }
        public DateTime FechaAsignacion { get; set; }
    }

    // DTO for viewing complete sale details including credentials
    public class VentaCompletaDTO
    {
        public int VentaID { get; set; }
        public int ClienteID { get; set; }
        public string NombreCliente { get; set; } = string.Empty;
        public string TelefonoCliente { get; set; } = string.Empty;
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public int? Duracion { get; set; }
        public decimal Monto { get; set; }
        public string Moneda { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;
        public string? Notas { get; set; }
        public int? MedioPagoID { get; set; }
        public string? NombreMedioPago { get; set; }
        public int? UsuarioID { get; set; }
        public string? NombreUsuario { get; set; }
        public List<VentaDetalleCompletaDTO> Detalles { get; set; } = new();
    }

    public class VentaDetalleCompletaDTO
    {
        public int VentaDetalleID { get; set; }
        public int ServicioID { get; set; }  // Needed for filtering accounts by service in edit modal
        public int CuentaID { get; set; }     // Needed for edit modal to know current account
        public int PerfilID { get; set; }     // Needed for edit modal to know current profile
        public string NombreServicio { get; set; } = string.Empty;
        public string CodigoCuenta { get; set; } = string.Empty;
        public string EmailCuenta { get; set; } = string.Empty;
        public string PasswordCuenta { get; set; } = string.Empty;
        public int NumeroPerfil { get; set; }
        public string? PinPerfil { get; set; }
        public decimal PrecioUnitario { get; set; }
        public int? ComboID { get; set; }  // To identify which services belong to a combo
    }

    // DTO for updating/editing sale details
    public class ActualizarVentaDTO
    {
        public List<ActualizarVentaDetalleDTO> Detalles { get; set; } = new();
    }

    public class ActualizarVentaDetalleDTO
    {
        public int VentaDetalleID { get; set; }
        public int? NuevaCuentaID { get; set; }
        public int? NuevoPerfilID { get; set; }
    }

    public class CrearVentaDTO
    {
        public int ClienteID { get; set; }
        public DateTime FechaFin { get; set; }  // Changed from Duracion to FechaFin
        public int? MedioPagoID { get; set; }  // Medio de pago usado
        public string Moneda { get; set; } = "C$";
        public string? Notas { get; set; }
        public List<CrearVentaDetalleDTO> Detalles { get; set; } = new();  // Multiple services
    }

    public class CrearVentaDetalleDTO
    {
        public int CuentaID { get; set; }
        public int PerfilID { get; set; }
        public int ServicioID { get; set; }
        public int? ComboID { get; set; }
        public decimal? PrecioUnitario { get; set; }
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

    // DTOs de Combos
    public class ComboDTO
    {
        public int ComboID { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public decimal Precio { get; set; }
        public bool Activo { get; set; }
        public DateTime FechaCreacion { get; set; }
        public List<ServicioDTO> Servicios { get; set; } = new List<ServicioDTO>();
    }

    public class CrearComboDTO
    {
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public decimal Precio { get; set; }
        public List<int> ServiciosIDs { get; set; } = new List<int>(); // IDs de los servicios que conforman el combo
    }

    public class ActualizarComboDTO
    {
        public string? Nombre { get; set; }
        public string? Descripcion { get; set; }
        public decimal? Precio { get; set; }
        public bool? Activo { get; set; }
        public List<int>? ServiciosIDs { get; set; } // Si se proporciona, actualiza los servicios del combo
    }

    // DTOs de Ingresos
    public class IngresoDTO
    {
        public int IngresoID { get; set; }
        public DateTime FechaCreacion { get; set; }
        public decimal Monto { get; set; }
        public int? UsuarioID { get; set; }
        public string? Usuario { get; set; }
        public string? Descripcion { get; set; }
        public int? VentaID { get; set; }
    }

    public class CrearIngresoDTO
    {
        public decimal Monto { get; set; }
        public string? Descripcion { get; set; }
        public int? VentaID { get; set; }
    }

    public class ActualizarIngresoDTO
    {
        public decimal? Monto { get; set; }
        public string? Descripcion { get; set; }
        public int? VentaID { get; set; }
    }

    // DTOs de Egresos
    public class EgresoDTO
    {
        public int EgresoID { get; set; }
        public DateTime FechaCreacion { get; set; }
        public decimal Monto { get; set; }
        public int? UsuarioID { get; set; }
        public string? Usuario { get; set; }
        public string? Descripcion { get; set; }
        public int? CuentaID { get; set; }
    }

    public class CrearEgresoDTO
    {
        public decimal Monto { get; set; }
        public string? Descripcion { get; set; }
        public int? CuentaID { get; set; }
    }

    public class ActualizarEgresoDTO
    {
        public decimal? Monto { get; set; }
        public string? Descripcion { get; set; }
        public int? CuentaID { get; set; }
    }
}
