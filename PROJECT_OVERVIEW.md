# Chat Bot Project - Complete Architecture Overview

## 📋 Project Structure

```
Chat_bot/
├── backend/                    # Django REST API Server
│   ├── backend/               # Django project settings
│   │   ├── settings.py        # Configuration (CORS, JWT, Database)
│   │   ├── urls.py            # API route configuration
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── db/                    # Main app with database models
│   │   ├── models.py          # Database schema
│   │   ├── views.py           # API endpoints & business logic
│   │   ├── admin.py           # Django admin interface
│   │   ├── apps.py
│   │   └── management/commands/
│   │       └── create_test_user.py  # User creation utility
│   ├── manage.py
│   └── db.sqlite3             # Database file
│
└── frontend/                   # React Web App
    ├── src/
    │   ├── App.js             # Landing page & login
    │   ├── AdminDashboard.js  # Admin dashboard (legacy)
    │   ├── index.css          # Tailwind CSS with theme
    │   ├── admin/page.tsx     # Modern admin panel (TypeScript/Next.js)
    │   └── chat/page.tsx      # Stakeholder chat interface
    ├── package.json           # Dependencies
    ├── tailwind.config.js
    └── postcss.config.js
```

---

## 🗄️ Database Models (Backend)

### 1. **User** (Django built-in)
- **Fields**: username, email, password (hashed), is_active, is_superuser
- **Role**: Superuser = Admin, Regular User = Stakeholder
- **Creation**: Via Django admin interface

### 2. **Questionnaire**
- **Fields**: id (UUID), title, description, meta (JSON), created_by (FK to User), created_at, is_active
- **Purpose**: Defines questionnaire structure
- **Relations**: Has many Questions & Sessions

### 3. **Question**
- **Fields**: id (UUID), questionnaire (FK), position, question_text, type, options, required
- **Types**: text, textarea, choice, checkbox, rating
- **Purpose**: Individual questions in a questionnaire

### 4. **Session**
- **Fields**: id (UUID), user (FK), questionnaire (FK), current_question_index, total_questions, is_completed, last_updated, expires_at
- **Purpose**: Tracks user progress through questionnaire
- **Relations**: Has many Answers

### 5. **Answer**
- **Fields**: id (UUID), session (FK), question (FK), answer_text, answer_json, answered_at
- **Purpose**: Stores user responses

### 6. **AuditLog**
- **Fields**: id (autoincrement), actor (FK to User), action, object_type, object_id, payload (JSON), created_at
- **Purpose**: Tracks all user actions for compliance/debugging

---

## 🔗 API Endpoints (Backend)

### Authentication
- **POST** `/api/login/` - User login with email/password
  - Returns: JWT token, refresh token, user info (id, email, role, name)
  - Role determination: is_superuser → 'admin', else → 'stakeholder'

### Questionnaires
- **GET** `/api/questionnaires/` - List all questionnaires (requires auth)
- **POST** `/api/questionnaires/` - Create new questionnaire
- **DELETE** `/api/questionnaires/<id>/` - Delete questionnaire

### Users
- **GET** `/api/users/` - List all users
- **POST** `/api/users/` - Create new user
- **GET** `/api/users/<id>/` - Get user details
- **POST** `/api/users/<id>/assign/` - Assign questionnaire to user
- **POST** `/api/users/<id>/remind/` - Send reminder to user

### Responses
- **GET** `/api/responses/` - Get all responses/answers (requires auth)

### Dashboard
- **GET** `/api/dashboard/stats/` - Dashboard statistics (requires auth)
- **GET** `/api/dashboard/activity/` - Recent activity log (requires auth)

---

## 🎨 Frontend Pages

### 1. **App.js (Landing Page & Login)**
- Landing page with features & contact info
- Login form that sends email & password to `/api/login/`
- Routes users based on role:
  - Admin → `/admin`
  - Stakeholder → `/chat` (if questionnaire assigned)
- Stores session in localStorage

### 2. **AdminDashboard.js (Admin Interface - Legacy)**
- Manage questionnaires (create, delete)
- Manage users
- View responses & audit logs
- CSV import/export
- Uses localStorage for token storage

### 3. **admin/page.tsx (Modern Admin Panel - TypeScript/Next.js)**
- More complete admin interface
- Dashboard with statistics (users, questionnaires, sessions, answers)
- Manage questionnaires with full CRUD
- Manage users with role assignment
- Assign questionnaires to specific users
- Email notifications
- Recent activity tracking
- Export data to PDF

### 4. **chat/page.tsx (Stakeholder Chat Interface)**
- Conversational questionnaire interface
- Displays questions one at a time
- Progress tracking
- Save/resume functionality
- Completion notification

---

## 🔐 Authentication Flow

```
1. User visits http://localhost:3000
2. User clicks "Client Login"
3. Frontend sends POST /api/login/ with email & password
4. Backend:
   - Looks up user by email
   - Verifies password with Django auth
   - Generates JWT tokens
   - Determines role (admin or stakeholder)
   - Returns tokens & user info
5. Frontend stores session in localStorage
6. Frontend redirects based on role
7. API requests use JWT token in Authorization header
```

---

## 🚀 Running the Project

### Backend (Django)
```bash
cd backend
python manage.py migrate              # Initialize database
python manage.py createsuperuser      # Create admin user (via CLI)
# OR
python manage.py create_test_user --email admin@test.com --password admin123 --is-admin

python manage.py runserver           # Start server at localhost:8000
```

### Frontend (React)
```bash
cd frontend
npm install                          # Install dependencies
npm start                            # Start dev server at localhost:3000
```

### Django Admin Interface
- URL: http://localhost:8000/admin/
- Create users here (set email, password, active status, superuser flag)
- Create/manage questionnaires & questions

---

## 📱 User Types & Workflows

### Admin User
1. Login with email/password
2. Redirected to `/admin`
3. Can:
   - Create/delete questionnaires
   - Create/manage users
   - Assign questionnaires to stakeholders
   - View responses & analytics
   - Send reminders

### Stakeholder User
1. Login with email/password
2. Check if assigned a questionnaire
   - If yes → redirect to `/chat` (fill questionnaire)
   - If no → show error message
3. In chat:
   - Answer questions conversationally
   - Save progress
   - Resume later
   - Submit when complete

---

## 🛠️ Tech Stack

**Backend:**
- Django 5.2.4
- Django REST Framework
- Simple JWT (authentication)
- SQLite (database)
- CORS middleware

**Frontend:**
- React 18.2.0
- Tailwind CSS 3.4
- Next.js (TypeScript components)
- JavaScript/JSX

---

## 🔄 Key Features

✅ User authentication with JWT tokens
✅ Admin dashboard for managing questionnaires & users
✅ Questionnaire assignment to specific users
✅ Conversational chat interface for stakeholders
✅ Progress tracking & save/resume
✅ Audit logging of all actions
✅ Dashboard statistics
✅ Email notifications (configured but needs email setup)
✅ CSV import/export
✅ Responsive UI with Tailwind CSS
✅ CORS enabled for frontend-backend communication

---

## ⚙️ Configuration

**CORS Settings** (settings.py):
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

**JWT Settings**:
- Access token lifetime: 60 minutes
- Refresh token lifetime: 1 day

**Database**: SQLite (for development)

---

## 🐛 Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| "Invalid credentials or inactive account" | Verify user exists in admin panel, is active, has email, and password is set |
| Frontend can't connect to backend | Ensure Django is running on localhost:8000, check CORS settings |
| Can't login after creating user in admin | User password not hashed properly - use `create_test_user` command or set password in admin UI |
| Questionnaire not assigned to stakeholder | Use admin interface to assign questionnaire to user |

---

## 📝 Next Steps

1. **Authentication**: Users created in Django admin with proper password hashing
2. **Create Questionnaires**: Via admin interface or API
3. **Assign Questionnaires**: Link questionnaires to stakeholder users
4. **Users fill questionnaires**: Login as stakeholder → complete questionnaire in chat
5. **View Analytics**: Admin can see responses & statistics

