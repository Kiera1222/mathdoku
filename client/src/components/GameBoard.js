import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

// Update to point to the correct server port
const SERVER_URL = process.env.NODE_ENV === 'production' 
  ? '' // Use relative URL in production
  : 'http://localhost:8080'; // Use explicit URL in development

const GameBoard = ({ level, password, onCancel }) => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState('connecting');
  const [puzzle, setPuzzle] = useState(null);
  const [solution, setSolution] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [completionTime, setCompletionTime] = useState(null);
  const [opponentCompleted, setOpponentCompleted] = useState(false);
  const [gameResults, setGameResults] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);

  const checkCompletion = useCallback((currentSolution) => {
    if (!puzzle) return;
    
    // Check if all cells are filled
    const isComplete = Object.keys(currentSolution).length === puzzle.size * puzzle.size;
    
    if (isComplete) {
      const time = Date.now() - startTime;
      setCompletionTime(time);
      socket?.emit('puzzle_completed', { 
        roomId: `${level}-${password}`,
        solution: currentSolution,
        time 
      });
      setGameState('completed');
    }
  }, [puzzle, startTime, socket, level, password]);

  const handleCellChange = useCallback((row, col, value) => {
    const newSolution = { ...solution };
    newSolution[`${row}-${col}`] = value;
    setSolution(newSolution);

    // Check if puzzle is completed
    checkCompletion(newSolution);
  }, [solution, checkCompletion]);

  const handleCancel = () => {
    if (socket) {
      socket.disconnect();
    }
    onCancel();
  };

  // Update the timer every second
  useEffect(() => {
    let timer;
    if (gameState === 'playing' && startTime) {
      timer = setInterval(() => {
        setCurrentTime(Date.now() - startTime);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameState, startTime]);

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
  
  // Handle keyboard input for the selected cell
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedCell || !puzzle) return;
      
      const { row, col } = selectedCell;
      // Handle number keys 1-9
      if (e.key >= '1' && e.key <= '9' && parseInt(e.key) <= puzzle.size) {
        handleCellChange(row, col, parseInt(e.key));
      }
      // Handle delete/backspace
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        handleCellChange(row, col, null);
      }
      // Handle arrow keys for navigation
      else if (e.key === 'ArrowUp' && row > 0) {
        setSelectedCell({ row: row - 1, col });
      }
      else if (e.key === 'ArrowDown' && row < puzzle.size - 1) {
        setSelectedCell({ row: row + 1, col });
      }
      else if (e.key === 'ArrowLeft' && col > 0) {
        setSelectedCell({ row, col: col - 1 });
      }
      else if (e.key === 'ArrowRight' && col < puzzle.size - 1) {
        setSelectedCell({ row, col: col + 1 });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCell, puzzle, handleCellChange]);

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
    
    // Create a grid representation of the puzzle
    const grid = Array(puzzle.size).fill(0).map(() => Array(puzzle.size).fill(null));
    
    // Find which cage each cell belongs to
    const cellToCage = {};
    puzzle.cages.forEach(cage => {
      cage.cells.forEach(cell => {
        cellToCage[`${cell.row}-${cell.col}`] = cage;
      });
    });

    // Find border style for each cell (to show cage boundaries)
    const getCellBorders = (row, col) => {
      const borders = { top: false, right: false, bottom: false, left: false };
      const currentCage = cellToCage[`${row}-${col}`];
      
      // Check top border
      if (row > 0 && cellToCage[`${row-1}-${col}`]?.id !== currentCage.id) {
        borders.top = true;
      } else if (row === 0) {
        borders.top = true;
      }
      
      // Check right border
      if (col < puzzle.size - 1 && cellToCage[`${row}-${col+1}`]?.id !== currentCage.id) {
        borders.right = true;
      } else if (col === puzzle.size - 1) {
        borders.right = true;
      }
      
      // Check bottom border
      if (row < puzzle.size - 1 && cellToCage[`${row+1}-${col}`]?.id !== currentCage.id) {
        borders.bottom = true;
      } else if (row === puzzle.size - 1) {
        borders.bottom = true;
      }
      
      // Check left border
      if (col > 0 && cellToCage[`${row}-${col-1}`]?.id !== currentCage.id) {
        borders.left = true;
      } else if (col === 0) {
        borders.left = true;
      }
      
      return borders;
    };

    // Create operation symbol for display
    const getOperationSymbol = (op) => {
      switch (op) {
        case 'add': return '+';
        case 'subtract': return '-';
        case 'multiply': return '×';
        case 'divide': return '÷';
        default: return '';
      }
    };

    // Check if this cell should display the cage target and operation
    const isFirstCell = (cage, row, col) => {
      return cage.cells[0].row === row && cage.cells[0].col === col;
    };
    
    // Validate a cell value
    const isCellValid = (row, col, value) => {
      if (!value) return true; // Empty cells are always valid
      
      // Check row constraint (Latin square)
      for (let c = 0; c < puzzle.size; c++) {
        if (c !== col && solution[`${row}-${c}`] === value) {
          return false;
        }
      }
      
      // Check column constraint (Latin square)
      for (let r = 0; r < puzzle.size; r++) {
        if (r !== row && solution[`${r}-${col}`] === value) {
          return false;
        }
      }
      
      return true;
    };

    return (
      <div className="game-container">
        <div className="puzzle-info">
          <p>Puzzle Level: {level}</p>
          <p>Opponent status: {opponentCompleted ? 'Completed' : 'Still solving'}</p>
        </div>
        
        <div 
          className="puzzle-grid" 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${puzzle.size}, 40px)`,
            gridTemplateRows: `repeat(${puzzle.size}, 40px)`,
            gap: '1px',
            margin: '20px auto'
          }}
        >
          {Array.from({ length: puzzle.size }).map((_, row) => (
            Array.from({ length: puzzle.size }).map((_, col) => {
              const cage = cellToCage[`${row}-${col}`];
              const borders = getCellBorders(row, col);
              const cellValue = solution[`${row}-${col}`];
              const isSelected = selectedCell && selectedCell.row === row && selectedCell.col === col;
              const isValid = isCellValid(row, col, cellValue);
              
              return (
                <div 
                  key={`${row}-${col}`}
                  className={`puzzle-cell ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedCell({ row, col })}
                  style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    backgroundColor: isSelected ? '#e0f7fa' : isValid ? 'white' : '#ffebee',
                    borderTop: borders.top ? '2px solid black' : '1px solid #ddd',
                    borderRight: borders.right ? '2px solid black' : '1px solid #ddd',
                    borderBottom: borders.bottom ? '2px solid black' : '1px solid #ddd',
                    borderLeft: borders.left ? '2px solid black' : '1px solid #ddd',
                    fontSize: '18px',
                    cursor: 'pointer',
                    color: isValid ? 'black' : 'red'
                  }}
                >
                  {cellValue}
                  
                  {isFirstCell(cage, row, col) && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: '2px',
                        left: '2px',
                        fontSize: '10px',
                        lineHeight: '10px'
                      }}
                    >
                      {cage.targetNumber}{getOperationSymbol(cage.operation)}
                    </div>
                  )}
                </div>
              );
            })
          ))}
        </div>
        
        <div className="number-controls">
          {Array.from({ length: puzzle.size }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (selectedCell) {
                  handleCellChange(selectedCell.row, selectedCell.col, i + 1);
                }
              }}
              className="number-button"
              style={{
                margin: '5px',
                width: '30px',
                height: '30px'
              }}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => {
              if (selectedCell) {
                handleCellChange(selectedCell.row, selectedCell.col, null);
              }
            }}
            className="clear-button"
            style={{
              margin: '5px',
              width: '60px',
              height: '30px'
            }}
          >
            Clear
          </button>
        </div>
        
        <div className="timer" style={{ marginTop: '10px' }}>
          Time elapsed: {formatTime(currentTime)}
        </div>
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