# STREAMDOOR Frontend - Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- npm or yarn installed

## Installation

1. **Navigate to the ClientApp directory:**
   ```bash
   cd ClientApp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment (optional):**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env to set your API URL if different from default
   # VITE_API_URL=http://localhost:5000/api
   ```

## Development

**Start the development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Building for Production

**Create a production build:**
```bash
npm run build
```

The build output will be in the `wwwroot/` directory.

**Preview the production build:**
```bash
npm run preview
```

## Default Login Credentials

Use the credentials created in your backend:
- **Email:** admin@streamdoor.com (or as configured)
- **Password:** Your admin password

## Available Routes

Once logged in, you can access:
- `/dashboard` - Main dashboard with metrics
- `/clientes` - Client management
- `/servicios` - Service management
- `/correos` - Email management
- `/cuentas` - Account management
- `/ventas` - Sales management
- `/medios-pago` - Payment methods
- `/usuarios` - User management

## Features Overview

### 1. Dashboard
- View key metrics (clients, sales, revenue)
- See charts for trends
- Get alerts for expiring/expired sales

### 2. Clientes (Clients)
- Add new clients with contact information
- Edit existing clients
- Search and filter clients
- Delete clients (with confirmation)

### 3. Servicios (Services)
- Add streaming services with pricing
- Set service duration
- Categorize services
- Manage service catalog

### 4. Correos (Emails)
- Manage email accounts
- **Generate random email and password** ✨
- Copy credentials to clipboard
- Track email providers

### 5. Cuentas (Accounts)
- Link clients to services
- **Generate secure passwords** ✨
- Store login credentials
- Manage service profiles

### 6. Ventas (Sales)
- Create new subscriptions
- Track subscription status:
  - **Active** (green)
  - **Próximo a Vencer** (orange)
  - **Vencido** (red)
- **Renew expiring subscriptions** ✨
- Filter by status
- View expiration dates

### 7. Medios de Pago (Payment Methods)
- Add payment methods
- Enable/disable methods
- Add descriptions

### 8. Usuarios (Users)
- Manage system users
- Assign roles (Admin, User, Salesperson)
- Update passwords
- Control access

## Tips & Tricks

### Keyboard Shortcuts
- `Tab` - Navigate between fields
- `Enter` - Submit forms
- `Esc` - Close modals

### Search & Filter
- All tables have search functionality
- Search is debounced (300ms) for performance
- Sales can be filtered by status

### Copy to Clipboard
- Click the copy icon next to passwords/emails
- Shows success notification
- Works in Correos and Cuentas

### Password Generation
- Click "Generar" button in Correos or Cuentas
- Creates secure 12-character password
- Includes uppercase, lowercase, numbers, symbols

### Status Colors
- **Green** - Everything is good (Active)
- **Orange** - Attention needed (Próximo a Vencer)
- **Red** - Action required (Vencido)
- **Gray** - Inactive/Cancelled

## Troubleshooting

### Cannot connect to API
- Verify backend is running on port 5000
- Check `.env` file has correct `VITE_API_URL`
- Check browser console for errors

### Login not working
- Verify user exists in database
- Check email/password are correct
- Check backend logs for authentication errors

### Build errors
- Run `npm install` again
- Delete `node_modules` and run `npm install`
- Check Node.js version (18+)

### Styles not loading
- Verify TailwindCSS is installed: `npm list tailwindcss`
- Clear browser cache
- Check console for CSS errors

## Development Workflow

1. **Start backend API** (port 5000)
2. **Start frontend dev server** (port 5173)
3. **Open browser** to http://localhost:5173
4. **Login** with admin credentials
5. **Start using the application**

## Production Deployment

1. Build the application: `npm run build`
2. The output in `wwwroot/` is ready to serve
3. Can be deployed with the ASP.NET backend
4. Or served separately via:
   - Vercel
   - Netlify
   - AWS S3
   - Azure Static Web Apps

## Support

For issues or questions:
1. Check the console for errors
2. Review network tab for API calls
3. Check backend logs
4. Verify API endpoints are working

## Next Steps

- Explore all modules
- Create test data
- Configure for your needs
- Customize styling (colors, fonts)
- Add your branding

---

**Enjoy using STREAMDOOR! 🚀**
