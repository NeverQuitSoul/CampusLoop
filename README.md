# CampusLoop

CampusLoop is a college Lost & Found web application that helps students report lost or found belongings, browse reports, contact other students, and track the status of reported items. Administrators can manage reports and monitor platform activity.

## Problem Statement

Students may find it difficult to report lost belongings or connect with someone who has found an item on campus. CampusLoop provides one central place to publish and browse Lost and Found reports.

## Project Objectives

- Make it easier for students to report lost and found items.
- Help students search and view reports in one place.
- Allow students to contact each other about reported items.
- Help administrators monitor reports and update their status.

## Live Project

- **Website:** https://neverquitsoul.github.io/CampusLoop/
- **Backend API:** https://campusloop-0a22.onrender.com
- **GitHub repository:** https://github.com/NeverQuitSoul/CampusLoop

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, JavaScript, Vite, React Router, CSS |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| Image storage | Cloudinary, Multer |
| Hosting | GitHub Pages (frontend), Render (backend) |

## Main Features

### Student features
- Student registration and login.
- Create Lost and Found reports with item details, location, date, description, and an optional image.
- Browse and search reports.
- View report summaries and full report details.
- Manage personal reports, including editing and deleting.
- View and update a student profile.
- Contact report owners through private in-app messages.
- View notifications and report progress information.
- Switch between light and dark themes.

### Administrator features
- Administrator login and protected dashboard.
- View dashboard statistics and monthly report analytics.
- Browse Lost and Found reports separately.
- Open Quick View and full report details.
- Manage reports and update their status, including marking items as returned.
- View registered student accounts.

## Application Structure

```text
CampusLoop/
├── backend/
│   ├── createAdmin.js
│   ├── package.json
│   └── server.js
├── docs/
│   ├── CampusLoop_Presentation.pptx
│   └── README.md
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   └── pages/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## How It Works

1. A student registers or logs in through the React frontend.
2. The frontend sends HTTP requests to the Express REST API.
3. The backend validates requests and uses MySQL to store and retrieve application data.
4. JWT authentication protects account-specific and administrator operations.
5. Uploaded report images are stored in Cloudinary, with their image URLs saved with the report data.
6. Students and administrators use the frontend to view and manage the information returned by the API.

## Local Development Setup

### Requirements
- Node.js and npm
- MySQL
- A Cloudinary account for image uploads

### 1. Clone the repository

```bash
git clone https://github.com/NeverQuitSoul/CampusLoop.git
cd CampusLoop
```

### 2. Configure the database

Create a MySQL database named `campusloop`. The application expects the required `users` and `items` tables, along with the columns used by the backend. The backend creates the `messages` and `notifications` tables if they do not already exist.

### 3. Configure backend environment variables

Create a `.env` file inside the `backend` directory. Add your own values:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=campusloop
JWT_SECRET=replace_with_a_long_random_secret
COLLEGE_EMAIL_DOMAIN=nbkrist.org
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

For a hosted MySQL service that requires SSL, configure `DB_SSL=true` and provide the CA certificate expected by the backend. Never commit your real `.env` file or credentials.

### 4. Install and run the backend

```bash
cd backend
npm install
npm start
```

The backend runs on port 5000 by default.

### 5. Install and run the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Use the local URL printed by Vite. For local development, configure the frontend API URL in `frontend/src/api.js` to point to your local backend (for example, `http://localhost:5000`). The committed configuration currently points to the deployed backend.

### 6. Create an administrator account

After the database and backend environment are configured, run the administrator setup script from the `backend` directory:

```bash
node createAdmin.js
```

Follow the prompts. Use a strong password and keep administrator credentials private.

## Deployment

- The React frontend is published through GitHub Pages.
- The Express backend is hosted on Render.
- MySQL is used for persistent application data.
- Cloudinary stores uploaded report images.

The frontend API configuration is in `frontend/src/api.js`. If deployment URLs change, update the configuration and redeploy the frontend.

## Important Notes

- Use a college email address accepted by the configured `COLLEGE_EMAIL_DOMAIN`.
- Student passwords are hashed before storage.
- Protected API requests use JWT authentication.
- Do not publish database passwords, JWT secrets, Cloudinary secrets, or administrator credentials.
- This README describes the current repository structure and implementation; update it whenever the application configuration or features change.

## Project Presentation

See [CampusLoop Presentation](docs/CampusLoop_Presentation.pptx) in the `docs` folder.
