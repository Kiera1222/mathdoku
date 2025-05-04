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