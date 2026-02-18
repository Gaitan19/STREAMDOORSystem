# STREAMDOOR System - Frontend

Modern React SPA for managing streaming services, clients, and subscriptions.

## Features

- **Authentication**: Login/logout with JWT tokens
- **Dashboard**: Overview with metrics, charts, and alerts
- **Client Management**: Full CRUD for clients
- **Services Management**: Full CRUD for services
- **Email Management**: Full CRUD with email/password generator
- **Account Management**: Full CRUD with password generator
- **Sales Management**: Full CRUD with renewal functionality and status tracking
- **Payment Methods**: Full CRUD for payment methods
- **User Management**: Full CRUD for system users
- **Responsive Design**: Works on mobile, tablet, laptop, and desktop

## Tech Stack

- **React 19** - UI framework
- **React Router v7** - Routing
- **TailwindCSS 3** - Styling
- **Vite** - Build tool
- **Axios** - HTTP client
- **Recharts** - Charts and data visualization
- **Lucide React** - Icons
- **js-cookie** - Cookie management

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update the API URL in .env if needed
# VITE_API_URL=http://localhost:5000/api
```

### Development

```bash
# Start development server
npm run dev

# Open browser at http://localhost:5173
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── Alert.jsx
│   ├── Button.jsx
│   ├── Card.jsx
│   ├── Input.jsx
│   ├── Layout.jsx
│   ├── Modal.jsx
│   ├── ProtectedRoute.jsx
│   ├── SearchBar.jsx
│   ├── Select.jsx
│   └── Table.jsx
├── context/           # React Context providers
│   └── AuthContext.jsx
├── pages/             # Page components
│   ├── Clientes.jsx
│   ├── Correos.jsx
│   ├── Cuentas.jsx
│   ├── Dashboard.jsx
│   ├── Login.jsx
│   ├── MediosPago.jsx
│   ├── Servicios.jsx
│   ├── Usuarios.jsx
│   └── Ventas.jsx
├── services/          # API service layer
│   └── apiService.js
├── utils/             # Helper functions
│   └── helpers.js
├── App.jsx            # Main app component with routing
└── main.jsx           # App entry point
```

## Features by Module

### Dashboard
- Metrics cards (clients, active sales, upcoming renewals, revenue)
- Line chart for sales trends
- Bar chart for monthly revenue
- Alerts for expiring and expired sales
- Quick stats overview

### Clientes (Clients)
- Create, read, update, delete clients
- Search and filter
- Email and phone validation
- Responsive table view

### Servicios (Services)
- Manage streaming services
- Categories and pricing
- Duration in days
- Search and filter

### Correos (Emails)
- Email account management
- Auto-generate email and password
- Copy to clipboard functionality
- Provider tracking

### Cuentas (Accounts)
- Service account management
- Link to clients and services
- Auto-generate passwords
- Profile name support

### Ventas (Sales)
- Sales and subscription tracking
- Status indicators (Active, ProximoVencer, Vencido)
- Renewal functionality
- Filter by status
- Visual alerts for expiring/expired

### Medios de Pago (Payment Methods)
- Payment method management
- Active/inactive status
- Description support

### Usuarios (Users)
- User management
- Role-based access (Administrador, Usuario, Vendedor)
- Password management
- Email validation

## State Management

- **Authentication**: Managed via AuthContext
- **API Calls**: Centralized in apiService.js
- **Form State**: Local component state
- **Alerts**: Local component state with auto-dismiss

## Styling

- **TailwindCSS**: Utility-first CSS framework
- **Responsive Design**: Mobile-first approach
- **Color Scheme**:
  - Primary: Blue (#3b82f6)
  - Success: Green (#10b981)
  - Warning: Orange (#f97316)
  - Danger: Red (#ef4444)
  - Info: Blue (#3b82f6)

## API Integration

All API calls go through the centralized `apiService.js` which:
- Adds authentication tokens to requests
- Handles 401 redirects
- Provides typed service methods
- Centralizes error handling

## Environment Variables

- `VITE_API_URL`: Backend API base URL (default: http://localhost:5000/api)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - All rights reserved

