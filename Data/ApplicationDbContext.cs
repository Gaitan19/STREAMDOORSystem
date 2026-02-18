using Microsoft.EntityFrameworkCore;
using STREAMDOORSystem.Models;

namespace STREAMDOORSystem.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Cliente> Clientes { get; set; }
        public DbSet<Servicio> Servicios { get; set; }
        public DbSet<Correo> Correos { get; set; }
        public DbSet<Cuenta> Cuentas { get; set; }
        public DbSet<Perfil> Perfiles { get; set; }
        public DbSet<MedioPago> MediosPago { get; set; }
        public DbSet<Venta> Ventas { get; set; }
        public DbSet<Pago> Pagos { get; set; }
        public DbSet<CorreoServicio> CorreosServicios { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configuraciones adicionales si son necesarias
            modelBuilder.Entity<Usuario>()
                .HasIndex(u => u.Correo)
                .IsUnique();

            modelBuilder.Entity<Correo>()
                .HasIndex(c => c.Email)
                .IsUnique();
        }
    }
}
