# Mathdoku Multiplayer

A multiplayer math puzzle game where players compete to solve Mathdoku puzzles (similar to KenKen/Calcudoku).

## Project Structure

```
mathdoku/
├── client/         # React frontend
├── server/         # Node.js backend
└── package.json    # Root package.json for running both client and server
```

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone this repository:
   ```
   git clone <repository-url>
   cd mathdoku
   ```

2. Install dependencies for the root project, client, and server:
   ```
   npm run install-all
   ```
   
   Or install them separately:
   ```
   npm install
   cd client && npm install
   cd ../server && npm install
   ```

## Running the Application

From the root directory (`mathdoku`), run:

```
npm run dev
```

This will start both the client and server concurrently:
- Client: http://localhost:3000
- Server: http://localhost:5002

## Deployment on Render.com

Render.com offers a free tier that allows deploying full-stack applications with their "Blueprint" feature using the render.yaml file.

### Prerequisites

1. Create a [Render.com](https://render.com) account

### Deployment Steps

1. From your Render dashboard, click "New" then "Blueprint"

2. Connect your GitHub repository with the Mathdoku code

3. Render will automatically detect the render.yaml file and set up the services

4. Click "Apply" to start the deployment process

5. Once deployed, Render will provide a URL to access your application

### Key Benefits of Render.com Free Tier

- Free web service hosting
- Automatic HTTPS
- Custom domains
- Continuous deployment from GitHub
- No sleep on inactivity for free tier

### Note About Free Plan Limitations

- 750 hours of runtime per month
- Automatic shutdown after 15 minutes of inactivity (but restarts on next visit)
- Limited to 512MB RAM
- Shared CPU usage

## Game Instructions

1. Select a grid size (3×3 to 9×9)
2. Enter a game password (this is used to join or create a game room)
3. Wait for an opponent to join with the same password
4. Solve the puzzle faster than your opponent to win!

## Troubleshooting

If you encounter the "address already in use" error when starting the server:

1. Find the process using the port:
   ```
   lsof -i :5002
   ```

2. Kill the process:
   ```
   kill -9 <PID>
   ```

3. Or change the port in:
   - `server/index.js` (PORT variable)
   - `client/src/components/GameBoard.js` (SERVER_URL constant)

## License

[Your license information here] 