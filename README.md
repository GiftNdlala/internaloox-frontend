# OOX Frontend

Modern React frontend for the OOX Furniture Internal Order Management System.

## Features

- 🎨 **Modern UI** - Built with Tailwind CSS for beautiful, responsive design
- 📱 **Mobile Responsive** - Optimized for all device sizes
- 🔐 **Authentication** - Secure login with role-based access
- 🎯 **Role-Based Dashboards** - Different interfaces for Owner, Admin, Warehouse, and Delivery
- ⚡ **Fast & Lightweight** - Optimized performance with modern React patterns

## Tech Stack

- **React 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Icons** - Beautiful icon library
- **React Bootstrap** - Additional UI components

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Install Tailwind CSS (if not already installed)

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. Start Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── admin/          # Admin-specific components
├── pages/              # Page components
│   ├── LoginPage.js    # Modern login page
│   ├── OwnerDashboard.js # Owner dashboard
│   ├── WarehouseDashboard.js
│   └── DeliveryDashboard.js
├── App.js              # Main app component
├── index.js            # App entry point
└── index.css           # Global styles with Tailwind
```

## Login Credentials

### Development Demo Accounts

- **Owner**: `oox` / `your_password_here`
- **Admin**: `admin` / `admin123`
- **Warehouse**: `warehouse` / `warehouse123`
- **Delivery**: `delivery` / `delivery123`

### Production

Use the credentials created through the Django admin panel.

## Features by Role

### Owner Dashboard
- Complete system overview
- User management (create, edit, delete)
- Order management
- Payment tracking
- System settings

### Admin Dashboard
- Order entry and management
- Customer management
- Payment tracking
- Basic reporting

### Warehouse Dashboard
- Production status tracking
- Order assembly management
- Inventory updates

### Delivery Dashboard
- Delivery scheduling
- Payment collection
- Delivery status updates

## Styling

This project uses **Tailwind CSS** for styling. Key features:

- **Responsive Design** - Mobile-first approach
- **Custom Components** - Reusable styled components
- **Dark Mode Ready** - Built-in dark mode support
- **Custom Animations** - Smooth transitions and effects

### Custom CSS Classes

```css
.btn-primary          /* Primary button with gradient */
.input-field         /* Styled input fields */
.card-shadow         /* Enhanced card shadows */
.text-gradient       /* Gradient text effects */
```

## API Integration

The frontend connects to the Django backend API:

- **Base URL**: `http://localhost:8000`
- **Authentication**: Session-based with CSRF tokens
- **Endpoints**: RESTful API endpoints for all operations

## Development

### Adding New Components

1. Create component in `src/components/`
2. Use Tailwind classes for styling
3. Follow the existing component patterns

### Adding New Pages

1. Create page in `src/pages/`
2. Add route in `App.js`
3. Implement role-based access control

### Styling Guidelines

- Use Tailwind utility classes
- Follow mobile-first responsive design
- Maintain consistent spacing and colors
- Use the custom color palette defined in `tailwind.config.js`

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

## Troubleshooting

### Tailwind CSS Not Working

1. Ensure Tailwind is installed: `npm install -D tailwindcss`
2. Check `tailwind.config.js` exists
3. Verify `@tailwind` directives are in `index.css`
4. Restart the development server

### API Connection Issues

1. Ensure Django backend is running on port 8000
2. Check CORS settings in Django
3. Verify proxy configuration in `package.json`

## Contributing

1. Follow the existing code style
2. Use Tailwind CSS for styling
3. Test on mobile devices
4. Ensure role-based access works correctly 