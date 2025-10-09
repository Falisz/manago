# Manago Project

## Overview
Manago, the Staff Management App is a full-stack web application designed for staff management, featuring a React.js frontend and an Express.js backend, integrated with a PostgreSQL database.
The application provides a user-friendly interface for managing employees, roles, posts, and other organizational resources, with a robust API-driven architecture to facilitate communication between the frontend and backend.

The backend follows the Model-View-Controller (MVC) architectural pattern, leveraging Sequelize for database models, API endpoints as views, and controller functions for business logic.

The frontend is a React.js single-page application (SPA) that consumes the backend API to deliver a dynamic and responsive user experience.

## Prerequisites
- **Node.js**: Ensure Node.js is installed on your system.
- **Database**: A running, sequelize-compatible database instance. 
  - Database type, port, name, user, password are all configured in the backend's `.env` file.

## Setup Instructions

### Backend
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Ensure the `.env` file is configured with the database credentials (e.g., `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`).
4. Initialize the database with seed data, by hitting space key on the startup of the backend server app.
5. Start the backend server (runs on port `5000`):
   ```bash
   npm start
   ```
   The backend accepts API requests at `http://localhost:5000`.

### Frontend
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server (runs on port `3000`):
   ```bash
   npm start
   ```
   The frontend was bootstrapped with [Create React App](https://github.com/facebook/create-react-app) and is accessible at `http://localhost:3000`.

## Notes
- Ensure the database instance is running and accessible before starting the backend.
- The backend relies on the `.env` file for database configuration. Verify the credentials match the `appagent` user and `staff_portal` database.
