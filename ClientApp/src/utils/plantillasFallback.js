// Default (fallback) template content used when the database templates are not yet loaded.
// These match the default Contenido values seeded in data.sql for the corresponding keys.

export const DEFAULT_DETALLES_TPL =
  `📌 {NOMBRE_SERVICIO}\n\nAcceda con los siguientes datos por favor\n` +
  `🛡 Correo: {CORREO}\n⚔ Contraseña: {CONTRASENA}\n⚙ Tipo: PERFIL\n\n` +
  `👤 Perfil: {PERFIL}   {PIN}\n🆔 # VENTA: V-{ID_VENTA}\n\n` +
  `⏳ Fecha de inicio: {FECHA_INICIO}\n✂ Fecha de corte: {FECHA_FIN}\n` +
  `💰 PRECIO: {PRECIO} {MONEDA}\n\n`;
