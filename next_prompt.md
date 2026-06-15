PROJECT NAME

Opendrap DevOps AI

PROJECT VISION

Build a modern cloud-native developer collaboration, deployment, testing, monitoring, networking, and AI-powered DevOps platform.

Opendrap combines features inspired by GitHub, Discord, Jira, Postman, Playwright, LinkedIn, Cloudflare Tunnel, and AI QA tools into a single platform.

The platform allows developers, freelancers, startups, and companies to connect, collaborate, deploy applications, test software, monitor systems, manage projects, chat, track bugs, and run AI-powered testing from one dashboard.

Every user is equal. There are no global Owner/Admin roles. Users can connect with each other through requests, create projects, collaborate, assign permissions inside projects, chat, manage tasks, and run deployments.

TECH STACK

Frontend:

* React
* Vite
* TypeScript
* TailwindCSS
* shadcn/ui
* xterm.js
* Recharts

Hosting:

* Cloudflare Pages

Backend:

* Cloudflare Workers
* TypeScript

Database:

* Cloudflare D1

Realtime:

* Cloudflare Durable Objects
* WebSockets

Storage:

* Backblaze B2

AI:

* GLM-4.7 Flash

Testing:

* Playwright

Public URLs:

* Cloudflare Tunnel

Agent:

* Python

====================================================

AUTHENTICATION SYSTEM

Users can register and login using:

1. Email + Password
2. Google OAuth
3. GitHub OAuth

AUTH FLOW

User
→ Login Page
→ Continue with Google
OR
→ Continue with GitHub
OR
→ Email Login

After authentication:

Create User Profile Automatically

Store:

id
username
name
email
avatar
provider
created_at

Required APIs:

POST /auth/register
POST /auth/login
POST /auth/logout
GET /auth/me

OAuth APIs:

GET /auth/google
GET /auth/google/callback

GET /auth/github
GET /auth/github/callback

Create JWT Authentication.

Create Auth Middleware.

Store Sessions.

====================================================

USER PROFILE SYSTEM

Each user has:

* Username
* Full Name
* Avatar
* Bio
* Skills
* Company
* GitHub URL
* Website
* Experience
* Projects
* Connections

User Profile Actions:

* Edit Profile
* Update Skills
* Change Avatar
* Add Company
* Add Social Links

====================================================

GLOBAL SEARCH SYSTEM

Search by:

* Username
* Name
* Company
* Skill
* Technology
* Project Name

Search Results:

Users
Companies
Projects

Endpoint:

GET /search?q=

====================================================

CONNECTION SYSTEM

Flow:

Search User
→ Open Profile
→ Send Connection Request
→ Accept Request
→ Connected

After connection:

* Private Chat Enabled
* Project Invite Enabled
* Team Collaboration Enabled

Tables:

connection_requests
connections

Endpoints:

POST /connections/request
POST /connections/accept
POST /connections/reject
DELETE /connections/:id

====================================================

COMPANY SYSTEM

Users can create or join companies.

Company Profile:

* Company Name
* Description
* Website
* Team Members
* Projects

Features:

Create Company
Join Company
Leave Company
View Members

====================================================

PROJECT SYSTEM

Create Project

Fields:

* Name
* Description
* Git Repository
* Branch
* Technology

Project Flow:

Create Project
→ Connect GitHub Repository
→ Install Agent
→ Clone Repository
→ Setup Environment
→ Run Application
→ Generate Public URL
→ Run Tests
→ Monitor Logs

====================================================

GITHUB INTEGRATION

Connect GitHub Account

OAuth Required

Features:

* View Repositories
* Select Repository
* Clone Repository
* Pull Changes
* Switch Branches

GitHub APIs:

GET /github/repos
GET /github/branches
POST /github/connect
POST /github/clone
POST /github/pull

Store:

github_access_token
github_username

====================================================

AGENT SYSTEM

User runs:

curl https://opendrap.com/install.sh | bash

Creates:

~/opendrap/
├── agent.py
├── config.json
├── startup.sh
├── project/

Agent connects via WebSocket to Durable Object.

Agent Features:

* Heartbeat
* Git Clone
* Git Pull
* Branch Switch
* Run Commands
* Stream Logs
* Start Cloudflare Tunnel
* Run Playwright
* Upload Results

====================================================

REALTIME TERMINAL

Browser
→ Worker
→ Durable Object
→ Agent
→ Cloud Shell

Supports:

* Linux Commands
* Python Commands
* Node Commands
* Git Commands

Live Output Streaming

====================================================

DEPLOYMENT SYSTEM

Clone Repository

Create Environment

Python:

* Create Venv
* Install Requirements

Node:

* Install Dependencies

Run Application

Generate Cloudflare Tunnel URL

Store Deployment History

====================================================

MONITORING

Live Monitoring:

* CPU Usage
* Memory Usage
* Disk Usage
* Network Usage

Agent sends metrics every 10 seconds.

====================================================

LOGS

Live Logs

Filters:

* Info
* Warning
* Error

Search Logs

Realtime Log Streaming

====================================================

ERROR TRACKING

Store:

* Error Message
* Stack Trace
* Request Data
* Environment
* Timestamp

Error Dashboard

====================================================

AI TESTING

User Prompt:

"Test this application like a customer"

Playwright Executes:

* Homepage Test
* Login Test
* Registration Test
* Form Test
* Navigation Test
* API Test

Outputs:

* Screenshots
* Videos
* Test Reports

====================================================

AI ANALYSIS

Use GLM-4.7 Flash

Features:

* Log Analysis
* Bug Analysis
* Screenshot Analysis
* Test Summary
* Suggested Fixes

Endpoints:

POST /ai/analyze-log
POST /ai/analyze-bug
POST /ai/generate-tests

====================================================

BUG TRACKING

Create Bug

Fields:

* Title
* Description
* Screenshot
* Video
* Priority
* Status

Statuses:

Open
In Progress
Testing
Fixed
Closed

Assign Users

Comment System

====================================================

TASK MANAGEMENT

Kanban Board

Columns:

Todo
In Progress
Testing
Done

Tasks:

* Title
* Description
* Assignee
* Priority
* Due Date

====================================================

CHAT SYSTEM

Private Chat

Group Chat

Project Chat

Realtime using Durable Objects

Supports:

* Text
* Images
* Files
* Mentions

====================================================

DATABASE TABLES

users
companies
connections
connection_requests
projects
project_members
deployments
agent_sessions
tasks
task_comments
bugs
bug_comments
chats
chat_members
messages
notifications
activity_logs
error_logs
ai_test_runs

====================================================

STORAGE

Cloudflare D1

Store:

* Users
* Projects
* Tasks
* Connections
* Messages
* Deployments

Backblaze B2

Store:

* Screenshots
* Videos
* Reports
* Log Archives

====================================================

FINAL PRODUCT

Opendrap DevOps AI is a developer ecosystem where users can discover developers, connect with them, create companies, collaborate on projects, deploy applications, generate public URLs, monitor logs, run AI testing, manage tasks, track bugs, communicate through chat, and build software together using a unified Cloudflare-powered platform.
