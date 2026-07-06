# AI Study Assistant (MERN + Gemini API)

A full-stack study/doubt-solving assistant. Students sign up, ask questions on
any subject, get instant AI-generated explanations (via Google Gemini), and
track their progress by subject over time.

**Live demo:** https://studymind-ai-frontend.onrender.com
**Backend API:** https://studymind-ai-fq6d.onrender.com

> Note: the backend is hosted on Render's free tier, which spins down after
> 15 minutes of inactivity. The first request after idle time can take
> ~30-50 seconds to wake up — this is expected, not a bug.

## Tech Stack
- **MongoDB** (Atlas) — stores users and question/answer history
- **Express.js** — REST API
- **React** (Vite) — frontend, with React Router
- **Node.js** — server runtime
- **Google Gemini API** — generates tutoring explanations
- **JWT + bcrypt** — authentication

## Features
- User registration/login (JWT-based auth)
- Real email verification via a 6-digit code sent to the user's inbox (Resend API)
- Ask a question on any subject → real AI-generated explanation
- Question history per user (view, filter by subject, delete)
- Progress dashboard: questions asked per subject, last activity date

---

## Setup Instructions

### 1. Get your free Gemini API key
Go to https://aistudio.google.com/app/apikey, sign in with Google, and click
"Create API key". Copy it — you'll need it below.

### 2. Set up MongoDB Atlas (free tier)
1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account
2. Create a free M0 cluster
3. Under "Database Access", create a user with a password
4. Under "Network Access", add `0.0.0.0/0` (allow access from anywhere — fine for dev)
5. Click "Connect" → "Drivers" → copy the connection string, it looks like:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/studyassistant`

### 3. Set up Resend for sending verification emails
Your app sends a 6-digit verification code by email when someone registers,
using the [Resend](https://resend.com) API (chosen because many free hosting
tiers, including Render, block outbound SMTP connections — Resend sends over
plain HTTPS instead, which works reliably everywhere).

1. Go to https://resend.com and sign up for a free account
2. Go to **API Keys** in the dashboard and copy the auto-generated key (starts with `re_...`)
3. That's it — no domain verification needed to get started

**Known limitation (free/unverified Resend account):** Resend's free tier only
allows sending test emails to the address you signed up with. Real multi-user
verification email delivery would require verifying a custom domain at
resend.com/domains and updating the `from` address in
`backend/utils/emailService.js` accordingly. For this portfolio project, the
flow is fully functional and demonstrable using the account owner's own email.

### 4. Backend setup
```bash
cd backend
npm install
cp .env.example .env
```
Open `.env` and fill in:
```
MONGO_URI=<your Atlas connection string>
JWT_SECRET=<any long random string>
GEMINI_API_KEY=<your Gemini key>
RESEND_API_KEY=<your Resend API key>
```
Then run:
```bash
npm run dev
```
Server starts on `http://localhost:5000`.

### 5. Frontend setup
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173` and proxies `/api` calls to the backend.

### 6. Try it out
- Open `http://localhost:5173`
- Register a new account — you'll be asked to enter a 6-digit code sent to your email
- Check your inbox (and spam folder) for the code, enter it, and you'll be logged in
- Ask a question like: subject = "Data Structures", question = "What is the
  difference between a stack and a queue?"
- You should get a real Gemini-generated explanation within a couple seconds

---

## Resume Bullets (once you've built and tested it)

**AI Study Assistant | MERN Stack, Google Gemini API**
- Built a full-stack MERN application enabling students to ask subject-specific
  questions and receive real-time AI-generated explanations via the Google
  Gemini API
- Implemented secure JWT-based authentication with bcrypt password hashing for
  user registration and login
- Built a real email verification system sending time-limited 6-digit codes
  and gating account activation until the email is confirmed; diagnosed and
  fixed a production SMTP connectivity failure by migrating from Nodemailer/
  Gmail to the Resend HTTP API
- Designed a MongoDB schema and used aggregation pipelines to compute
  per-subject progress analytics (questions asked, last activity)
- Built a responsive React (Vite) frontend with protected routes, a live
  question/answer interface, and a progress-tracking dashboard
- Structured a RESTful Express API with modular routes, middleware-based
  route protection, and error handling

## Interview Talking Points
Be ready to explain, in your own words:
- **Auth flow**: how JWT works — token issued on login/register, sent in the
  `Authorization: Bearer <token>` header, verified by middleware on protected routes
- **Why Gemini over hardcoding answers**: shows you integrated a real external
  API, handled its response format, and managed API keys via environment
  variables (never hardcoded/committed)
- **Aggregation pipeline**: how `$group` and `$match` compute per-subject
  stats directly in MongoDB rather than in application code
- **Password security**: bcrypt hashing, never storing plaintext passwords
- **Debugging the email delivery issue**: after deployment, Gmail SMTP
  connections from Render started timing out (`ETIMEDOUT` on connect) — many
  hosting providers restrict outbound SMTP ports to prevent spam abuse. Root
  cause was found by adding explicit error logging around the previously
  silent catch block, then fixed by switching to a transactional email API
  (Resend) that sends over standard HTTPS instead of SMTP — a good story about
  reading logs carefully and picking the right tool once a lower-level
  constraint (network policy) is discovered
- Be honest that this was a portfolio project built to learn the stack — that's
  a completely normal and respected answer for an early-career developer

## Possible Extensions (if you want to go further)
- Add subject-wise streaks or a "study calendar" heatmap
- Support file/image uploads for handwritten questions (OCR + Gemini vision)
- Add a leaderboard or weekly summary email
