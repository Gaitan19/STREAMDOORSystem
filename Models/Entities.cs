using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STREAMDOORSystem.Models
{
    [Table("Usuarios")]
    public class Usuario
    {
        [Key]
        public int UsuarioID { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Correo { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? Telefono { get; set; }

        [Required]
        [MaxLength(255)]
        public string PasswordHash { get; set; } = string.Empty;

        public DateTime FechaCreacion { get; set; } = DateTime.Now;

        public bool Activo { get; set; } = true;
    }

    [Table("Clientes")]
    public class Cliente
    {
        [Key]
        public int ClienteID { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? SegundoNombre { get; set; }

        [Required]
        [MaxLength(100)]
        public string Apellido { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? SegundoApellido { get; set; }

        [Required]
        [MaxLength(20)]
        public string Telefono { get; set; } = string.Empty;

        public DateTime FechaRegistro { get; set; } = DateTime.Now;

        public bool Activo { get; set; } = true;
    }

    [Table("Servicios")]
    public class Servicio
    {
        [Key]
        public int ServicioID { get; set; }

        [Required]
        [MaxLength(50)]
        public string Nombre { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? Descripcion { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? Precio { get; set; }

        public bool Activo { get; set; } = true;
    }

    [Table("Correos")]
    public class Correo
    {
        [Key]
        public int CorreoID { get; set; }

        [Required]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string Password { get; set; } = string.Empty;

        public DateTime FechaCreacion { get; set; } = DateTime.Now;

        [MaxLength(500)]
        public string? Notas { get; set; }

        public bool Activo { get; set; } = true;
    }

    [Table("Cuentas")]
    public class Cuenta
    {
        [Key]
        public int CuentaID { get; set; }

        [Required]
        public int ServicioID { get; set; }

        public int? CorreoID { get; set; }

        [Required]
        [MaxLength(20)]
        public string TipoCuenta { get; set; } = "Propia";

        public int NumeroPerfiles { get; set; } = 1;

        public int PerfilesDisponibles { get; set; } = 1;

        [MaxLength(20)]
        public string Estado { get; set; } = "Disponible";

        public DateTime FechaCreacion { get; set; } = DateTime.Now;

        [Column(TypeName = "datetime")]
        public DateTime? FechaFinalizacion { get; set; }

        public bool Activo { get; set; } = true;

        [ForeignKey("ServicioID")]
        public virtual Servicio? Servicio { get; set; }

        [ForeignKey("CorreoID")]
        public virtual Correo? Correo { get; set; }
    }

    [Table("Perfiles")]
    public class Perfil
    {
        [Key]
        public int PerfilID { get; set; }

        [Required]
        public int CuentaID { get; set; }

        [Required]
        public int NumeroPerfil { get; set; }

        [MaxLength(10)]
        public string? PIN { get; set; }

        [MaxLength(20)]
        public string Estado { get; set; } = "Disponible";

        public bool Activo { get; set; } = true;

        [ForeignKey("CuentaID")]
        public virtual Cuenta? Cuenta { get; set; }
    }

    [Table("MediosPago")]
    public class MedioPago
    {
        [Key]
        public int MedioPagoID { get; set; }

        [Required]
        [MaxLength(50)]
        public string Tipo { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? NumeroCuenta { get; set; }

        [MaxLength(100)]
        public string? Beneficiario { get; set; }

        [Required]
        [MaxLength(10)]
        public string Moneda { get; set; } = "C$";

        public bool Activo { get; set; } = true;

        public DateTime FechaCreacion { get; set; } = DateTime.Now;
    }

    [Table("Ventas")]
    public class Venta
    {
        [Key]
        public int VentaID { get; set; }

        [Required]
        public int ClienteID { get; set; }

        [Required]
        public int CuentaID { get; set; }

        public int? PerfilID { get; set; }

        [Required]
        public DateTime FechaInicio { get; set; }

        [Required]
        public DateTime FechaFin { get; set; }

        [Required]
        public int Duracion { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal Monto { get; set; }

        [Required]
        [MaxLength(10)]
        public string Moneda { get; set; } = "C$";

        [MaxLength(20)]
        public string Estado { get; set; } = "Activo";

        public DateTime FechaCreacion { get; set; } = DateTime.Now;

        [ForeignKey("ClienteID")]
        public virtual Cliente? Cliente { get; set; }

        [ForeignKey("CuentaID")]
        public virtual Cuenta? Cuenta { get; set; }

        [ForeignKey("PerfilID")]
        public virtual Perfil? Perfil { get; set; }
    }

    [Table("Pagos")]
    public class Pago
    {
        [Key]
        public int PagoID { get; set; }

        [Required]
        public int VentaID { get; set; }

        [Required]
        public int MedioPagoID { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal Monto { get; set; }

        [Required]
        [MaxLength(10)]
        public string Moneda { get; set; } = "C$";

        public DateTime FechaPago { get; set; } = DateTime.Now;

        [MaxLength(100)]
        public string? Referencia { get; set; }

        [MaxLength(500)]
        public string? Notas { get; set; }

        [ForeignKey("VentaID")]
        public virtual Venta? Venta { get; set; }

        [ForeignKey("MedioPagoID")]
        public virtual MedioPago? MedioPago { get; set; }
        public DateTime FechaCreacion { get; internal set; }
    }

    [Table("CorreosServicios")]
    public class CorreoServicio
    {
        [Key]
        public int CorreoServicioID { get; set; }

        [Required]
        public int CorreoID { get; set; }

        [Required]
        public int ServicioID { get; set; }

        public DateTime FechaAsociacion { get; set; } = DateTime.Now;

        [ForeignKey("CorreoID")]
        public virtual Correo? Correo { get; set; }

        [ForeignKey("ServicioID")]
        public virtual Servicio? Servicio { get; set; }
    }
}
