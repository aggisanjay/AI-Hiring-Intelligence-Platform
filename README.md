# HireIQ — AI Hiring Intelligence Platform

> A full-stack MERN platform that uses Gemini AI to score resumes, conduct mock interviews, and streamline the hiring pipeline.

![HireIQ](https://img.shields.io/badge/HireIQ-AI%20Hiring%20Platform-6366f1?style=for-the-badge&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)

---

## ✨ Features

### 🧑‍💼 Recruiter Portal
- Post and manage job listings with skill requirements and salary ranges
- Kanban pipeline — move candidates through Applied → Shortlisted → Interview → Offer → Rejected
- AI-powered resume scoring with strengths, missing skills, and fit summary
- Talent pool with search and skill filters
- Analytics dashboard — hiring funnel, score distribution, skill gaps, applications over time

### 👩‍💻 Candidate Portal
- Browse and apply to jobs with resume upload (stored on Cloudinary)
- Instant AI resume analysis score on every application
- AI mock interview simulator — role-specific questions, follow-ups, 8-question session
- Immediate evaluation report — communication score, technical score, Hire/Consider/Reject verdict
- Application tracking with status history and email notifications

### 🤖 AI Features (Google Gemini)
- Resume analysis with structured JSON scoring
- Context-aware interview question generation
- Full interview evaluation with detailed feedback
- Automatic retry on rate limits with fallback questions

---



## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, Recharts |
| Backend | Node.js, Express.js, ES6 Modules |
| Database | MongoDB with Mongoose |
| AI | Google Gemini 2.0 Flash |
| File Storage | Cloudinary (resume PDFs) |
| Auth | JWT with bcrypt |
| Email | Nodemailer (Gmail SMTP) |
| Deployment | Render (backend) + Vercel (frontend) |

---

## 📁 Project Structure

```
hiring-platform/
├── backend/
│   ├── config/
│   │   ├── cloudinary.js        # Cloudinary client
│   │   ├── db.js                # MongoDB connection
│   │   ├── logger.js            # Winston logger
│   │   └── redis.js             # Stubs (no worker needed)
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT auth + role-based access
│   │   ├── errorHandler.js      # Global error handler
│   │   └── upload.middleware.js # Multer + Cloudinary storage
│   ├── modules/
│   │   ├── auth/                # Register, login, profile
│   │   ├── candidates/          # Apply, pipeline, status updates
│   │   ├── interviews/          # AI interview sessions
│   │   └── jobs/                # Job CRUD, pipeline, analytics
│   ├── services/
│   │   ├── ai.service.js        # Gemini AI (resume, interview, evaluate)
│   │   ├── email.service.js     # SMTP email with HTML templates
│   │   └── scoring.service.js   # Weighted match score algorithm
│   ├── seed/seed.js             # Demo data
│   └── server.js
├── frontend/
│   └── src/
│       ├── api/axios.js         # Axios instance + all API functions
│       ├── context/AuthContext.jsx
│       └── pages/
│           ├── auth/            # Login, Register
│           ├── recruiter/       # Dashboard, Jobs, Pipeline, Analytics, Candidates
│           └── candidate/       # Dashboard, Browse, Applications, Interview, Profile
├── render.yaml                  # One-click Render deploy
└── README.md
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or [Atlas](https://cloud.mongodb.com))
- Gemini API key — [get one free](https://aistudio.google.com/app/apikey)
- Cloudinary account — [free tier](https://cloudinary.com)
- Gmail App Password — [setup guide](https://support.google.com/accounts/answer/185833)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/hireiq.git
cd hireiq
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# MongoDB
MONGO_URI=mongodb://localhost:27017/hireiq_platform

# Auth
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=7d

# Google Gemini AI
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.0-flash

# Cloudinary (resume storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM="HireIQ <your.email@gmail.com>"
```

Seed demo data:

```bash
npm run seed
```

Start the server:

```bash
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Demo Accounts

After running `npm run seed`:

| Role | Email | Password |
|---|---|---|
| Recruiter | sarah@techcorp.io | password123 |
| Recruiter | marcus@innovatelabs.io | password123 |
| Candidate | alex@email.com | password123 |
| Candidate | priya@email.com | password123 |
| Candidate | jake@email.com | password123 |

---

## 🌐 Production Deployment

### Backend → Render

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect this GitHub repo
3. Set **Root Directory** = `backend`
4. **Build Command**: `npm install`
5. **Start Command**: `node server.js`
6. Add all environment variables from `.env`

> The included `render.yaml` supports one-click deploy.

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Connect this GitHub repo
3. Set **Root Directory** = `frontend`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   ```
5. Deploy

After both are live, update `CLIENT_URL` on Render to your Vercel URL and redeploy.

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register recruiter or candidate |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Jobs
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/jobs` | List all jobs (public, filterable) |
| POST | `/api/jobs` | Create job (recruiter) |
| PUT | `/api/jobs/:id` | Update job (recruiter) |
| GET | `/api/jobs/:id/pipeline` | Kanban pipeline data |
| GET | `/api/jobs/:id/top-candidates` | Candidates ranked by AI score |

### Candidates
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/candidates/apply` | Apply with resume upload |
| GET | `/api/candidates/my-applications` | Candidate's own applications |
| PATCH | `/api/candidates/application/:id/status` | Move pipeline stage (recruiter) |
| GET | `/api/candidates/all` | Full talent pool (recruiter) |

### Interviews
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/interviews/start` | Start AI interview session |
| POST | `/api/interviews/:id/message` | Send answer, receive next question |
| POST | `/api/interviews/:id/complete` | Submit and evaluate |
| POST | `/api/interviews/:id/retry` | Retry failed evaluation |
| GET | `/api/interviews/:id/result` | Get evaluation results |
| GET | `/api/interviews/my` | List candidate's interviews |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/dashboard` | KPI metrics |
| GET | `/api/analytics/funnel` | Hiring funnel |
| GET | `/api/analytics/score-distribution` | AI score buckets |
| GET | `/api/analytics/skill-gaps` | Top missing skills across all jobs |

---

## 🤖 AI Scoring

### Resume Match Score (0–100)

```
matchScore = (skillMatch × 0.6) + (experienceMatch × 0.3) + (aiScore × 0.1)
```

| Signal | Weight | Description |
|---|---|---|
| Skill match | 60% | % of required skills the candidate has |
| Experience match | 30% | Candidate years vs job minimum |
| AI score | 10% | Gemini resume quality assessment |

### Interview Evaluation

After the 8-question session, Gemini analyzes the full transcript and returns:

| Field | Description |
|---|---|
| `communicationScore` | Clarity, structure, articulation (0–100) |
| `technicalScore` | Depth of knowledge and accuracy (0–100) |
| `overallScore` | Holistic assessment (0–100) |
| `strengths` | 3–4 specific strengths demonstrated |
| `improvements` | 2–3 areas to work on |
| `recommendation` | Hire / Consider / Reject |

---

## 🔧 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Min 32 chars |
| `GEMINI_API_KEY` | ✅ | Google AI Studio key |
| `CLOUDINARY_CLOUD_NAME` | ✅ | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | ✅ | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | ✅ | From Cloudinary dashboard |
| `SMTP_USER` | ⚡ | Gmail for sending emails |
| `SMTP_PASS` | ⚡ | Gmail App Password |
| `CLIENT_URL` | ⚡ | Frontend URL for CORS |
| `GEMINI_MODEL` | ➖ | Default: `gemini-2.0-flash` |
| `PORT` | ➖ | Default: `5000` |

> ✅ Required &nbsp;&nbsp; ⚡ Recommended &nbsp;&nbsp; ➖ Optional

---

## 📄 License

MIT — free to use, modify, and build upon.

---

<p align="center">Built with React · Express · MongoDB · Google Gemini</p>
