import React, { useState } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [level, setLevel] = useState(3);
  const [password, setPassword] = useState('');

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
          <h1>Mathdoku Multiplayer</h1>
          <form onSubmit={handleStartGame}>
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
            <div className="form-group">
              <label>Game Password:</label>
              <input 
                type="text" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a password to create or join a game"
                required
              />
            </div>
            <button type="submit" className="start-button">Start Game</button>
          </form>
        </div>
      ) : (
        <GameBoard level={level} password={password} onCancel={handleCancel} />
      )}
    </div>
  );
}

export default App; 