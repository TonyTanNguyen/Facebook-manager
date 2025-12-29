# Facebook Pages Manager

A centralized dashboard for managing multiple Facebook pages. Monitor and respond to comments and messages from all your pages in one place.

## Features

- 🔐 **Facebook OAuth Authentication** - Secure login with Facebook
- 📊 **Unified Dashboard** - View all pages in one place
- 💬 **Comments Management** - View and reply to comments (coming soon)
- 📨 **Messages Inbox** - Manage conversations (coming soon)
- 🎨 **Modern UI** - Beautiful dark theme with smooth animations

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- Framer Motion
- React Router DOM
- Lucide React Icons

### Backend
- Node.js + Express
- PostgreSQL + Sequelize ORM
- Passport.js (Facebook OAuth 2.0)
- JWT Authentication

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Facebook Developer App (for OAuth)

### 1. Clone and Install

```bash
cd "Facebook page manager"
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE fb_pages_manager;
```

### 3. Facebook App Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use existing one
3. Add "Facebook Login" product
4. Configure OAuth settings:
   - Valid OAuth Redirect URIs: `http://localhost:3001/api/auth/facebook/callback`
5. Request the following permissions:
   - `email`
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_read_user_content`
   - `pages_manage_engagement`
   - `pages_messaging`

### 4. Environment Configuration

Create `backend/.env` file (copy from `backend/env.example`):

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/fb_pages_manager

# Session & JWT
SESSION_SECRET=your-random-session-secret
JWT_SECRET=your-random-jwt-secret
JWT_EXPIRES_IN=7d

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3001/api/auth/facebook/callback
```

### 5. Run the Application

```bash
# Run both frontend and backend
npm run dev

# Or run separately:
npm run dev:backend  # Backend on http://localhost:3001
npm run dev:frontend # Frontend on http://localhost:5173
```

### 6. Access the App

Open http://localhost:5173 in your browser.

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js    # Sequelize configuration
│   │   │   └── passport.js    # Facebook OAuth strategy
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT authentication middleware
│   │   ├── models/
│   │   │   ├── User.js        # User model
│   │   │   ├── Page.js        # Page model
│   │   │   └── index.js       # Model exports
│   │   ├── routes/
│   │   │   └── auth.js        # Authentication routes
│   │   └── index.js           # Express server
│   ├── env.example            # Environment template
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Auth state management
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx    # Login screen
│   │   │   ├── AuthCallback.jsx # OAuth callback handler
│   │   │   └── Dashboard.jsx    # Main dashboard
│   │   ├── services/
│   │   │   └── api.js           # API client
│   │   ├── App.jsx              # Routes
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── package.json                  # Root monorepo config
└── README.md
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/facebook` | Initiate Facebook OAuth |
| GET | `/api/auth/facebook/callback` | OAuth callback |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/status` | Check auth status |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh` | Refresh JWT token |
| DELETE | `/api/auth/account` | Delete account |

## Development Phases

- [x] **Phase 1: Authentication** (Current)
  - Facebook OAuth integration
  - JWT token management
  - User session handling
  - Basic dashboard UI

- [ ] **Phase 2: Page Management**
  - Fetch user's Facebook pages
  - Page selection UI
  - Page access tokens

- [ ] **Phase 3: Comments**
  - Unified comments view
  - Reply to comments
  - Filtering and search

- [ ] **Phase 4: Messages**
  - Unified messages inbox
  - Reply to messages
  - Conversation threads

## License

MIT

