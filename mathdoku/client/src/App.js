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

  return (
    <div className="App">
      {!gameStarted ? (
        <div className="game-form">
          <h1>Mathdoku Multiplayer</h1>
          <form onSubmit={handleStartGame}>
            <div className="form-group">
              <label>Difficulty Level:</label>
              <select 
                value={level} 
                onChange={(e) => setLevel(parseInt(e.target.value))}
              >
                <option value={3}>Easy (3x3)</option>
                <option value={4}>Medium (4x4)</option>
                <option value={5}>Hard (5x5)</option>
                <option value={6}>Expert (6x6)</option>
              </select>
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
            <button type="submit">Start Game</button>
          </form>
        </div>
      ) : (
        <GameBoard level={level} password={password} />
      )}
    </div>
  );
}

export default App; 