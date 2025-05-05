import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Use relative URL for Socket.io connection (was http://localhost:5001)
const SERVER_URL = '';

const GameBoard = ({ level, password, onCancel }) => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState('connecting');
  const [puzzle, setPuzzle] = useState(null);
  const [solution, setSolution] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [completionTime, setCompletionTime] = useState(null);
  const [opponentCompleted, setOpponentCompleted] = useState(false);
  const [gameResults, setGameResults] = useState(null);

  useEffect(() => {
    // Connect to the server
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    // Set up event listeners
    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('join_game', { level, password });
    });

    newSocket.on('waiting_for_opponent', ({ roomId }) => {
      setGameState('waiting');
    });

    newSocket.on('start_game', ({ puzzle }) => {
      setPuzzle(puzzle);
      setGameState('playing');
      setStartTime(Date.now());
    });

    newSocket.on('player_completed', ({ playerId, time, allCompleted }) => {
      if (playerId !== newSocket.id) {
        setOpponentCompleted(true);
      }
    });

    newSocket.on('game_over', ({ winner, results }) => {
      setGameResults(results);
      setGameState('finished');
    });

    newSocket.on('opponent_disconnected', () => {
      setGameState('opponent_disconnected');
    });

    newSocket.on('room_full', () => {
      setGameState('room_full');
    });

    // Clean up on component unmount
    return () => {
      newSocket.disconnect();
    };
  }, [level, password]);

  const handleCellChange = (row, col, value) => {
    const newSolution = { ...solution };
    newSolution[`${row}-${col}`] = value;
    setSolution(newSolution);

    // Check if puzzle is completed
    checkCompletion(newSolution);
  };

  const checkCompletion = (currentSolution) => {
    // Implementation of puzzle completion check
    // This is a placeholder - actual implementation would verify the solution
    const isComplete = Object.keys(currentSolution).length === puzzle.size * puzzle.size;
    
    if (isComplete) {
      const time = Date.now() - startTime;
      setCompletionTime(time);
      socket.emit('puzzle_completed', { 
        roomId: `${level}-${password}`,
        solution: currentSolution,
        time 
      });
      setGameState('completed');
    }
  };

  const handleCancel = () => {
    if (socket) {
      socket.disconnect();
    }
    onCancel();
  };

  const renderGameState = () => {
    switch (gameState) {
      case 'connecting':
        return <div>Connecting to server...</div>;
      case 'waiting':
        return <div>Waiting for opponent to join...</div>;
      case 'playing':
        return renderPuzzle();
      case 'completed':
        return (
          <div>
            <h2>You completed the puzzle!</h2>
            <p>Time: {formatTime(completionTime)}</p>
            {opponentCompleted ? <p>Waiting for results...</p> : <p>Waiting for opponent to finish...</p>}
          </div>
        );
      case 'finished':
        return renderResults();
      case 'opponent_disconnected':
        return <div>Your opponent has disconnected.</div>;
      case 'room_full':
        return <div>The room is full. Please try a different password.</div>;
      default:
        return <div>Unknown game state.</div>;
    }
  };

  const renderPuzzle = () => {
    if (!puzzle) return null;
    
    // Placeholder for actual puzzle rendering
    return (
      <div className="puzzle-grid">
        {/* Render puzzle grid based on puzzle data */}
        <p>Puzzle Level: {level}</p>
        <p>Opponent status: {opponentCompleted ? 'Completed' : 'Still solving'}</p>
      </div>
    );
  };

  const renderResults = () => {
    if (!gameResults) return null;
    
    return (
      <div className="game-results">
        <h2>Game Results</h2>
        <ul>
          {gameResults.map((player, index) => (
            <li key={index}>
              {player.id === socket.id ? 'You' : 'Opponent'}: {formatTime(player.time)}
              {index === 0 ? ' (Winner)' : ''}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const formatTime = (ms) => {
    if (!ms) return '--:--';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="game-board">
      <h1>Mathdoku Multiplayer</h1>
      {renderGameState()}
      <button className="cancel-button" onClick={handleCancel}>
        Cancel
      </button>
    </div>
  );
};

export default GameBoard; 