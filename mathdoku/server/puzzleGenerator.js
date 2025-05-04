/**
 * Generates a Mathdoku puzzle of the specified size
 * @param {number} size - Size of the puzzle grid (3 for 3x3, 4 for 4x4, etc.)
 * @returns {Object} Puzzle object with constraints and size
 */
function generatePuzzle(size) {
  // Basic validation
  if (size < 3 || size > 6) {
    size = 4; // Default to 4x4 if invalid size
  }

  // Generate a valid Latin square as the solution
  const solution = generateLatinSquare(size);
  
  // Generate the cages and constraints
  const cages = generateCages(solution, size);
  
  return {
    size,
    cages,
    // Don't include the solution in the returned object
    // so players can't easily cheat
  };
}

/**
 * Generates a Latin square (each number appears exactly once in each row and column)
 * @param {number} size - Size of the Latin square
 * @returns {Array<Array<number>>} A valid Latin square
 */
function generateLatinSquare(size) {
  // Initialize with zeros
  const grid = Array(size).fill().map(() => Array(size).fill(0));
  
  // Fill first row with 1 to size
  for (let i = 0; i < size; i++) {
    grid[0][i] = i + 1;
  }
  
  // For each subsequent row, shift the previous row by 1
  for (let row = 1; row < size; row++) {
    for (let col = 0; col < size; col++) {
      grid[row][col] = grid[row-1][(col+1) % size];
    }
  }
  
  // Shuffle rows and columns for more randomness
  shuffleArray(grid);
  transposeMatrix(grid);
  shuffleArray(grid);
  
  return grid;
}

/**
 * Generates cages and their target values/operators
 * @param {Array<Array<number>>} solution - The solution grid
 * @param {number} size - Size of the puzzle
 * @returns {Array<Object>} Array of cage objects with cells and constraints
 */
function generateCages(solution, size) {
  const cages = [];
  const usedCells = new Set();
  
  // Create an initial set of single cells
  const allCells = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      allCells.push({ row, col });
    }
  }
  
  // Shuffle cells to create random cages
  shuffleArray(allCells);
  
  while (allCells.length > 0) {
    // Start a new cage
    const cage = [];
    const firstCell = allCells.pop();
    cage.push(firstCell);
    usedCells.add(`${firstCell.row}-${firstCell.col}`);
    
    // Decide if we add more cells to this cage (50% chance if we don't exceed 4 cells)
    const maxCageSize = Math.min(4, allCells.length + 1);
    let cageSize = 1;
    
    while (cageSize < maxCageSize && Math.random() < 0.5) {
      // Find a neighboring cell that's still available
      const neighbors = getAvailableNeighbors(cage, allCells, usedCells);
      if (neighbors.length === 0) break;
      
      // Select a random neighbor
      const idx = Math.floor(Math.random() * neighbors.length);
      const nextCell = neighbors[idx];
      
      // Remove it from allCells and add to the cage
      allCells.splice(allCells.findIndex(c => c.row === nextCell.row && c.col === nextCell.col), 1);
      cage.push(nextCell);
      usedCells.add(`${nextCell.row}-${nextCell.col}`);
      cageSize++;
    }
    
    // Generate constraint for this cage
    const constraint = generateConstraint(cage, solution);
    
    cages.push({
      cells: cage,
      ...constraint
    });
  }
  
  return cages;
}

/**
 * Get available neighboring cells for a cage
 * @param {Array<Object>} cage - Current cage cells
 * @param {Array<Object>} availableCells - Cells still available
 * @param {Set<string>} usedCells - Set of used cell coordinates
 * @returns {Array<Object>} Available neighboring cells
 */
function getAvailableNeighbors(cage, availableCells, usedCells) {
  const neighbors = [];
  
  // For each cell in the cage
  for (const cell of cage) {
    // Check all 4 directions
    const directions = [
      { row: cell.row - 1, col: cell.col }, // up
      { row: cell.row + 1, col: cell.col }, // down
      { row: cell.row, col: cell.col - 1 }, // left
      { row: cell.row, col: cell.col + 1 }, // right
    ];
    
    for (const dir of directions) {
      if (!usedCells.has(`${dir.row}-${dir.col}`)) {
        // Find this cell in availableCells
        const foundCell = availableCells.find(c => c.row === dir.row && c.col === dir.col);
        if (foundCell) {
          neighbors.push(foundCell);
        }
      }
    }
  }
  
  return neighbors;
}

/**
 * Generate a constraint (target and operator) for a cage
 * @param {Array<Object>} cage - Cells in the cage
 * @param {Array<Array<number>>} solution - Solution grid
 * @returns {Object} Constraint object with target value and operator
 */
function generateConstraint(cage, solution) {
  // Get values of cells in the cage
  const values = cage.map(cell => solution[cell.row][cell.col]);
  
  // For single-cell cages, just return the value
  if (cage.length === 1) {
    return {
      target: values[0],
      operator: null
    };
  }
  
  // Randomly choose an operator based on cage size
  const operators = cage.length === 2 ? ['+', '-', '*', '/'] : ['+', '*'];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  
  // Calculate target value based on operator
  let target;
  switch (operator) {
    case '+':
      target = values.reduce((sum, value) => sum + value, 0);
      break;
    case '-':
      // For subtraction, we sort to ensure positive result
      values.sort((a, b) => b - a);
      target = values.reduce((diff, value, index) => 
        index === 0 ? value : diff - value, 0);
      break;
    case '*':
      target = values.reduce((product, value) => product * value, 1);
      break;
    case '/':
      // For division, we sort to ensure integer result
      values.sort((a, b) => b - a);
      target = values.reduce((quotient, value, index) => 
        index === 0 ? value : quotient / value, 1);
      // Ensure it's an integer
      if (target !== Math.floor(target)) {
        // If result isn't integer, switch to multiplication
        target = values.reduce((product, value) => product * value, 1);
        return {
          target,
          operator: '*'
        };
      }
      break;
  }
  
  return {
    target,
    operator
  };
}

/**
 * Shuffle an array in-place
 * @param {Array} array - Array to shuffle
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Transpose a matrix in-place
 * @param {Array<Array>} matrix - Matrix to transpose
 */
function transposeMatrix(matrix) {
  const size = matrix.length;
  for (let i = 0; i < size; i++) {
    for (let j = i + 1; j < size; j++) {
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
    }
  }
}

module.exports = {
  generatePuzzle
}; 