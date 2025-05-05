import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../PuzzleStyles.css';

// Use relative paths for API calls when deployed
const SERVER_URL = '';

const SoloPuzzle = ({ level, password, onCancel }) => {
  const [loading, setLoading] = useState(true);
  const [puzzle, setPuzzle] = useState(null);
  const [solution, setSolution] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [completionTime, setCompletionTime] = useState(null);
  const [gameState, setGameState] = useState('loading');
  const [error, setError] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchPuzzle = async () => {
      try {
        setLoading(true);
        const response = await axios.post(`${SERVER_URL}/api/puzzle`, {
          size: level,
          password
        });
        
        setPuzzle(response.data);
        setGameState('playing');
        const now = Date.now();
        setStartTime(now);
        setCurrentTime(0);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching puzzle:', err);
        setError('Failed to load puzzle. Please try again.');
        setLoading(false);
      }
    };

    fetchPuzzle();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [level, password]);

  // Start timer when game begins
  useEffect(() => {
    if (gameState === 'playing' && startTime) {
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setCurrentTime(elapsed);
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [gameState, startTime]);

  const handleCellChange = (row, col, value) => {
    if (!value || (value >= 1 && value <= level)) {
      const newSolution = { ...solution };
      if (value) {
        newSolution[`${row}-${col}`] = parseInt(value);
      } else {
        delete newSolution[`${row}-${col}`];
      }
      setSolution(newSolution);

      // Check if puzzle is completed
      checkCompletion(newSolution);
    }
  };

  const handleCellClick = (row, col) => {
    setSelectedCell({ row, col });
  };

  const handleKeyDown = (e) => {
    if (!selectedCell) return;
    
    const { row, col } = selectedCell;
    
    if (e.key >= '1' && e.key <= '9' && parseInt(e.key) <= level) {
      handleCellChange(row, col, parseInt(e.key));
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      handleCellChange(row, col, null);
    } else if (e.key === 'ArrowUp' && row > 0) {
      setSelectedCell({ row: row - 1, col });
    } else if (e.key === 'ArrowDown' && row < level - 1) {
      setSelectedCell({ row: row + 1, col });
    } else if (e.key === 'ArrowLeft' && col > 0) {
      setSelectedCell({ row, col: col - 1 });
    } else if (e.key === 'ArrowRight' && col < level - 1) {
      setSelectedCell({ row, col: col + 1 });
    }
  };

  const checkCompletion = (currentSolution) => {
    if (!puzzle) return;

    // Check if all cells are filled
    if (Object.keys(currentSolution).length !== puzzle.size * puzzle.size) {
      return;
    }

    // Check if each row has unique numbers
    for (let row = 0; row < puzzle.size; row++) {
      const rowValues = new Set();
      for (let col = 0; col < puzzle.size; col++) {
        const value = currentSolution[`${row}-${col}`];
        if (rowValues.has(value)) return; // Duplicate found
        rowValues.add(value);
      }
    }

    // Check if each column has unique numbers
    for (let col = 0; col < puzzle.size; col++) {
      const colValues = new Set();
      for (let row = 0; row < puzzle.size; row++) {
        const value = currentSolution[`${row}-${col}`];
        if (colValues.has(value)) return; // Duplicate found
        colValues.add(value);
      }
    }

    // Check if each cage has the correct result
    for (const cage of puzzle.cages) {
      const cageValues = cage.cells.map(cell => currentSolution[`${cell.row}-${cell.col}`]);
      
      let result;
      switch (cage.operation) {
        case 'add':
          result = cageValues.reduce((sum, val) => sum + val, 0);
          break;
        case 'subtract':
          result = cageValues.sort((a, b) => b - a).reduce((diff, val, idx) => 
            idx === 0 ? val : diff - val, 0);
          break;
        case 'multiply':
          result = cageValues.reduce((product, val) => product * val, 1);
          break;
        case 'divide':
          result = cageValues.sort((a, b) => b - a).reduce((quotient, val, idx) => 
            idx === 0 ? val : quotient / val, 1);
          break;
        default:
          result = cageValues[0]; // For single-cell cages
      }
      
      if (Math.round(result) !== cage.targetNumber) return; // Cage constraint not satisfied
    }

    // If we made it here, the puzzle is solved correctly
    const time = Date.now() - startTime;
    setCompletionTime(time);
    setGameState('completed');
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleGiveUp = () => {
    setGameState('given_up');
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleCancel = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    onCancel();
  };

  const renderGameState = () => {
    switch (gameState) {
      case 'loading':
        return <div>Loading puzzle...</div>;
      case 'playing':
        return renderPuzzle();
      case 'completed':
        return (
          <div>
            <h2>Puzzle Completed!</h2>
            <p>Time: {formatTime(completionTime)}</p>
            <p>Share this password with friends so they can try the same puzzle:</p>
            <div className="share-info">
              <p><strong>Grid Size:</strong> {level}×{level}</p>
              <p><strong>Password:</strong> {password}</p>
            </div>
          </div>
        );
      case 'given_up':
        return (
          <div>
            <h2>You Gave Up</h2>
            <p>Time Spent: {formatTime(currentTime)}</p>
            <p>If this was a competition, your opponent wins.</p>
            <div className="share-info">
              <p><strong>Grid Size:</strong> {level}×{level}</p>
              <p><strong>Password:</strong> {password}</p>
            </div>
          </div>
        );
      default:
        return <div>Unknown game state.</div>;
    }
  };

  const renderPuzzle = () => {
    if (!puzzle) return null;
    
    // Create a mapping of cell coordinates to cage IDs for border rendering
    const cageMap = {};
    puzzle.cages.forEach(cage => {
      cage.cells.forEach(cell => {
        cageMap[`${cell.row}-${cell.col}`] = cage.id;
      });
    });
    
    // Create the grid
    const grid = [];
    for (let row = 0; row < puzzle.size; row++) {
      const rowCells = [];
      for (let col = 0; col < puzzle.size; col++) {
        // Find which cage this cell belongs to
        const cage = puzzle.cages.find(c => 
          c.cells.some(cell => cell.row === row && cell.col === col)
        );
        
        // Determine if this cell should show the cage operation and target
        const isFirstCell = cage.cells[0].row === row && cage.cells[0].col === col;
        
        // Simplified border approach - only render borders between different cages
        const cellClasses = ['puzzle-cell'];
        if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
          cellClasses.push('selected');
        }
        
        // Top border: only if above cell is different cage
        if (row === 0 || cageMap[`${row}-${col}`] !== cageMap[`${row-1}-${col}`]) {
          cellClasses.push('top-border');
        }
        
        // Left border: only if left cell is different cage
        if (col === 0 || cageMap[`${row}-${col}`] !== cageMap[`${row}-${col-1}`]) {
          cellClasses.push('left-border');
        }
        
        // Right and bottom borders
        const hasRightBorder = col === puzzle.size - 1 || 
                               (col < puzzle.size - 1 && cageMap[`${row}-${col}`] !== cageMap[`${row}-${col+1}`]);
                               
        const hasBottomBorder = row === puzzle.size - 1 || 
                                (row < puzzle.size - 1 && cageMap[`${row}-${col}`] !== cageMap[`${row+1}-${col}`]);
        
        rowCells.push(
          <div 
            key={`${row}-${col}`}
            className={cellClasses.join(' ')}
            onClick={() => handleCellClick(row, col)}
            data-row={row}
            data-col={col}
            data-cage-id={cage.id}
          >
            {isFirstCell && (
              <div className="cage-info">
                {cage.targetNumber}
                {cage.operation && cage.cells.length > 1 && (
                  <span className="operation">
                    {cage.operation === 'add' ? '+' : 
                     cage.operation === 'subtract' ? '-' : 
                     cage.operation === 'multiply' ? '×' : '÷'}
                  </span>
                )}
              </div>
            )}
            <input 
              type="text" 
              value={solution[`${row}-${col}`] || ''}
              onClick={() => handleCellClick(row, col)}
              readOnly
            />
            {hasRightBorder && <div className="right-border"></div>}
            {hasBottomBorder && <div className="bottom-border"></div>}
          </div>
        );
      }
      grid.push(
        <div key={row} className="puzzle-row">
          {rowCells}
        </div>
      );
    }
    
    return (
      <div className="puzzle-container" tabIndex="0" onKeyDown={handleKeyDown}>
        <div className="puzzle-timer">{formatTime(currentTime)}</div>
        <div className={`puzzle-grid size-${puzzle.size}`}>
          {grid}
        </div>
        <div className="number-buttons">
          {Array.from({ length: puzzle.size }, (_, i) => i + 1).map(num => (
            <button 
              key={num} 
              onClick={() => {
                if (selectedCell) {
                  handleCellChange(selectedCell.row, selectedCell.col, num);
                }
              }}
              className="number-button"
            >
              {num}
            </button>
          ))}
          <button 
            onClick={() => {
              if (selectedCell) {
                handleCellChange(selectedCell.row, selectedCell.col, null);
              }
            }}
            className="number-button clear"
          >
            Clear
          </button>
        </div>
        <button className="give-up-button" onClick={handleGiveUp}>
          Give Up
        </button>
      </div>
    );
  };

  const formatTime = (ms) => {
    if (!ms) return '0:00';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="game-board">
        <h1>Error</h1>
        <p>{error}</p>
        <button className="cancel-button" onClick={handleCancel}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="game-board">
      <h1>Mathdoku Puzzle</h1>
      {loading ? (
        <div>Loading puzzle...</div>
      ) : (
        renderGameState()
      )}
      <button className="cancel-button" onClick={handleCancel}>
        Exit Puzzle
      </button>
    </div>
  );
};

export default SoloPuzzle; 