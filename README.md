# Titan - Autonomous AI Project Management System

Titan is an intelligent, locally-deployable project management system powered by AI agents to revolutionize software development workflows, offering advanced collaboration and optimization tools.

## Project Architecture

The system has been split into two independently deployable components:

1. **Frontend Client** (`/client`)
   - React/TypeScript single-page application
   - Tailwind CSS for styling
   - React Query for API data fetching
   - WebSocket for real-time updates

2. **Backend Server** (`/server`)
   - Node.js/Express RESTful API
   - WebSocket server for real-time communication
   - LowDB for data persistence (can be replaced with PostgreSQL)
   - OpenAI integration for autonomous features
   - Puppeteer for web automation
   - Firebase integration for authentication (optional)

## Development

### Running the Client

```bash
cd client
npm install
npm run dev
```

The client will be available at http://localhost:3000

### Running the Server

```bash
cd server
npm install
npm run dev
```

The server API will be available at http://localhost:5000

## Building for Production

### Build Everything

```bash
./build-all.sh
```

This will create:
- `dist-client`: Built frontend files
- `dist-server`: Built backend files

### Build Individual Components

For frontend only:
```bash
cd client
./build.sh
```

For backend only:
```bash
cd server
./build.sh
```

## Deployment

### Deploying the Server (Backend)

The server is configured to be deployable on Render.com as a web service:

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the root directory to `server`
4. Use the following settings:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Add all required environment variables from `.env.example`

### Deploying the Client (Frontend)

The client can be deployed on any static hosting service:

1. Build the client: `cd client && ./build.sh`
2. Deploy the `dist-client` directory to:
   - Vercel
   - Netlify
   - GitHub Pages
   - Any static file host
3. Set the `VITE_API_URL` environment variable to point to your deployed server URL

## Environment Variables

### Client Variables
See `client/.env.example` for required frontend environment variables.

### Server Variables
See `server/.env.example` for required backend environment variables.

## Core Features

- **Autonomous AI Agents**: GPT-4o powered agents that autonomously manage and improve projects
- **Project Management**: Create and manage projects, features, milestones, and goals
- **Web Automation**: Automated browser interactions with websites
- **FINDOM Agent**: Specialized autonomous agent system for marketing and content management
- **Real-time Monitoring**: WebSocket-based real-time monitoring of autonomous operations

## Technical Stack

- TypeScript/React frontend
- Node.js/Express backend
- OpenAI GPT-4o integration
- LowDB JSON database
- WebSocket real-time communication
- Puppeteer web automation
- Firebase authentication (optional)