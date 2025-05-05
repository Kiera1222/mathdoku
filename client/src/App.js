import React, { useState } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import SoloPuzzle from './components/SoloPuzzle';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [level, setLevel] = useState(3);
  const [password, setPassword] = useState('');
  const [gameMode, setGameMode] = useState('solo'); // 'solo' or 'multi'
  const [multiplayerAction, setMultiplayerAction] = useState('create'); // 'create' or 'join'

  const handleStartGame = (e) => {
    e.preventDefault();
    if (password) {
      setGameStarted(true);
    }
  };

  const handleCancel = () => {
    setGameStarted(false);
  };

  return (
    <div className="App">
      {!gameStarted ? (
        <div className="game-form">
          <h1>Mathdoku</h1>
          <form onSubmit={handleStartGame}>
            <div className="form-group">
              <label>Game Mode:</label>
              <div className="game-mode-options">
                <button
                  type="button"
                  className={`game-mode-button ${gameMode === 'solo' ? 'selected' : ''}`}
                  onClick={() => setGameMode('solo')}
                >
                  Single Player
                </button>
                <button
                  type="button"
                  className={`game-mode-button ${gameMode === 'multi' ? 'selected' : ''}`}
                  onClick={() => setGameMode('multi')}
                >
                  Multiplayer
                </button>
              </div>
            </div>

            {gameMode === 'multi' && (
              <div className="form-group">
                <label>Multiplayer Option:</label>
                <div className="game-mode-options">
                  <button
                    type="button"
                    className={`game-mode-button ${multiplayerAction === 'create' ? 'selected' : ''}`}
                    onClick={() => setMultiplayerAction('create')}
                  >
                    Create Game
                  </button>
                  <button
                    type="button"
                    className={`game-mode-button ${multiplayerAction === 'join' ? 'selected' : ''}`}
                    onClick={() => setMultiplayerAction('join')}
                  >
                    Join Game
                  </button>
                </div>
              </div>
            )}

            {(gameMode === 'solo' || (gameMode === 'multi' && multiplayerAction === 'create')) && (
              <div className="form-group">
                <label>Select Grid Size:</label>
                <div className="grid-size-options">
                  {[3, 4, 5, 6, 7, 8, 9].map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`grid-size-button ${level === size ? 'selected' : ''}`}
                      onClick={() => setLevel(size)}
                    >
                      {size}×{size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>
                {gameMode === 'solo' 
                  ? 'Custom Password (for shared puzzles):' 
                  : multiplayerAction === 'create'
                    ? 'Create Game Password:'
                    : 'Enter Game Password:'}
              </label>
              <input 
                type="text" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder={gameMode === 'solo' 
                  ? "Share this password with friends to get the same puzzle"
                  : multiplayerAction === 'create'
                    ? "Create a unique password for your game"
                    : "Enter the password to join a game"}
                required
              />
              {gameMode === 'solo' && (
                <p className="help-text">
                  Anyone using the same password and grid size will get an identical puzzle.
                </p>
              )}
              {gameMode === 'multi' && multiplayerAction === 'create' && (
                <p className="help-text">
                  Share this password with an opponent to let them join your game.
                </p>
              )}
            </div>
            
            <button type="submit" className="start-button">
              {gameMode === 'solo' 
                ? 'Start Puzzle' 
                : multiplayerAction === 'create'
                  ? 'Create Game'
                  : 'Join Game'}
            </button>
          </form>
        </div>
      ) : (
        gameMode === 'solo' ? (
          <SoloPuzzle level={level} password={password} onCancel={handleCancel} />
        ) : (
          <GameBoard 
            level={level} 
            password={password} 
            onCancel={handleCancel} 
            isCreator={multiplayerAction === 'create'}
          />
        )
      )}
    </div>
  );
}

export default App; 