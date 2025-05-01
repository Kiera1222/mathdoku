# Mathdoku - Multiplayer Puzzle Game

Mathdoku is a multiplayer puzzle game where players compete to see who can solve the puzzle faster. The game is similar to KenKen or Calcudoku, requiring players to fill a grid with numbers while following specific rules.

## Features

- Choose from multiple grid sizes (3x3 to 9x9)
- No registration required - connect with a friend using a simple password
- Real-time gameplay with live opponent status
- Compete to solve the puzzle in the shortest time
- Beautiful and responsive UI

## Game Rules

1. Fill the grid with numbers 1 through N (where N is the grid size)
2. Each row and column must contain each number exactly once (like Sudoku)
3. Each cage (outlined section) has a target number and operation
4. The numbers in the cage must combine using the specified operation to equal the target number

For example, a cage with "5+" means the numbers in that cage must add up to 5.

## Tech Stack

- **Frontend**: React
- **Backend**: Node.js, Express
- **Real-time Communication**: Socket.IO
- **Data Storage**: In-memory (for simplicity)

## Setup Instructions

### Prerequisites

- Node.js (v14+ recommended)
- npm (v6+ recommended)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/mathdoku.git
   cd mathdoku
   ```

2. Install dependencies for both client and server
   ```
   npm run install-all
   ```

### Running the Application

To run both client and server simultaneously:

```
npm run dev
```

This will start:
- Frontend at http://localhost:3000
- Backend at http://localhost:5000

To run them separately:

```
npm run client  # For the React frontend
npm run server  # For the Node.js backend
```

## How to Play

1. Open the app in your browser at http://localhost:3000
2. Select a grid size (e.g., 6x6)
3. Enter a password and share it with your friend
4. Wait for your friend to join using the same password
5. The game will start automatically when both players are connected
6. First player to correctly solve the puzzle wins!

## Future Enhancements

- User accounts and persistent stats
- Leaderboards
- More puzzle variants
- Mobile app version

## License

ISC 