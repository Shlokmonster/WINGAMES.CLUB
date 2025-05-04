# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# WINGAMES - Gaming Platform

## Deployment Guide

### Frontend Deployment (Netlify)

1. Push your code to GitHub
2. Log in to Netlify (netlify.com)
3. Click "New site from Git"
4. Choose your GitHub repository
5. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 18.x (or your project's version)

6. Environment Variables (Add in Netlify settings):
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_BACKEND_URL=your_render_backend_url
   ```

### Backend Deployment (Render)

1. Push your backend code to a separate GitHub repository
2. Log in to Render (render.com)
3. Click "New +" and select "Web Service"
4. Connect your GitHub repository
5. Configure the service:
   - Name: wingames-backend
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Node version: 18.x (or your project's version)

6. Environment Variables (Add in Render settings):
   ```
   NODE_ENV=production
   PORT=8000
   DATABASE_URL=your_database_url
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   JWT_SECRET=your_jwt_secret
   ```

### Database Setup

1. Ensure your Supabase database is properly configured
2. Set up the following tables:
   - users
   - wallets
   - transactions
   - games
   - matches

### Post-Deployment Steps

1. Update Frontend Environment:
   - Go to Netlify site settings
   - Add all required environment variables
   - Trigger a new deployment

2. Update Backend Environment:
   - Go to Render dashboard
   - Add all required environment variables
   - Restart the service

3. Test the Application:
   - Test user authentication
   - Test wallet functionality
   - Test game mechanics
   - Test real-time features

### Monitoring and Maintenance

1. Set up monitoring in Render dashboard
2. Configure Netlify forms for contact
3. Set up error tracking (optional)
4. Regular database backups

### Common Issues and Solutions

1. CORS Issues:
   - Ensure backend CORS configuration matches Netlify domain
   - Add Netlify domain to allowed origins

2. Environment Variables:
   - Double-check all environment variables are set
   - Ensure no trailing spaces in values

3. Build Issues:
   - Check Node version compatibility
   - Verify all dependencies are properly listed in package.json

4. Database Connection:
   - Verify database connection strings
   - Check database access permissions

### Support

For any issues or questions, please contact:
- Technical Support: [Your Contact Info]
- Admin Dashboard: [Admin Portal URL]

### Security Notes

1. Never commit sensitive information to Git
2. Use environment variables for all secrets
3. Regularly rotate API keys and secrets
4. Monitor application logs for suspicious activity
