/**
 * Mathdoku Puzzle Generator
 * 
 * This module generates Mathdoku puzzles (similar to KenKen or Calcudoku)
 * For each puzzle, the grid must follow Latin square rules (no repeating number in rows or columns)
 * And each cage has a target number that must be reached using the specified operation
 */

// Generate a valid Latin square (grid where no number repeats in any row or column)
function generateLatinSquare(size) {
  const grid = Array(size).fill(0).map(() => Array(size).fill(0));
  
  // Fill the first row with sequential numbers 1 to size
  for (let i = 0; i < size; i++) {
    grid[0][i] = i + 1;
  }
  
  // For each subsequent row, shift the previous row to create Latin square
  for (let i = 1; i < size; i++) {
    for (let j = 0; j < size; j++) {
      grid[i][j] = grid[i-1][(j+1) % size];
    }
  }
  
  // Randomly shuffle rows and columns to create variety
  // Shuffle rows (except first row)
  for (let i = 1; i < size; i++) {
    const swapWith = Math.floor(Math.random() * (size - 1)) + 1;
    if (i !== swapWith) {
      [grid[i], grid[swapWith]] = [grid[swapWith], grid[i]];
    }
  }
  
  // Shuffle columns
  for (let j = 0; j < size; j++) {
    const swapWith = Math.floor(Math.random() * size);
    if (j !== swapWith) {
      for (let i = 0; i < size; i++) {
        [grid[i][j], grid[i][swapWith]] = [grid[i][swapWith], grid[i][j]];
      }
    }
  }
  
  return grid;
}

// Create cages for the puzzle
function generateCages(size, grid) {
  // Start with each cell in its own cage
  let cages = [];
  let cageId = 1;
  
  // Initialize cellToCage mapping (which cage each cell belongs to)
  const cellToCage = Array(size).fill(0).map(() => Array(size).fill(0));
  
  // First assign each cell to its own cage
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      cellToCage[i][j] = cageId;
      cages.push({
        id: cageId,
        cells: [{row: i, col: j}],
        value: grid[i][j],
        operation: null,
        targetNumber: grid[i][j]
      });
      cageId++;
    }
  }
  
  // Number of cage merges to perform (more for larger grids)
  // This determines how complex the puzzle will be
  const numMerges = Math.floor(size * size * 0.6);
  
  for (let m = 0; m < numMerges; m++) {
    // Find a random cell
    const randomRow = Math.floor(Math.random() * size);
    const randomCol = Math.floor(Math.random() * size);
    const currentCageId = cellToCage[randomRow][randomCol];
    
    // Find a neighboring cell
    const neighbors = [];
    if (randomRow > 0) neighbors.push({row: randomRow - 1, col: randomCol});
    if (randomRow < size - 1) neighbors.push({row: randomRow + 1, col: randomCol});
    if (randomCol > 0) neighbors.push({row: randomRow, col: randomCol - 1});
    if (randomCol < size - 1) neighbors.push({row: randomRow, col: randomCol + 1});
    
    if (neighbors.length === 0) continue;
    
    const neighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
    const neighborCageId = cellToCage[neighbor.row][neighbor.col];
    
    // Skip if already in the same cage
    if (currentCageId === neighborCageId) continue;
    
    // Find the two cages
    const currentCage = cages.find(cage => cage.id === currentCageId);
    const neighborCage = cages.find(cage => cage.id === neighborCageId);
    
    // Skip if the merged cage would be too large (limit to sqrt(size) + 1 cells)
    if (currentCage.cells.length + neighborCage.cells.length > Math.sqrt(size) + 1) continue;
    
    // Merge the cages
    const mergedCells = [...currentCage.cells, ...neighborCage.cells];
    
    // Assign an operation and calculate target number
    const operations = ['add', 'subtract', 'multiply', 'divide'];
    let operation = operations[Math.floor(Math.random() * operations.length)];
    let targetNumber;
    
    // Get cell values from the grid
    const cellValues = mergedCells.map(cell => grid[cell.row][cell.col]);
    
    // For smaller cages (2 cells), allow all operations
    // For larger cages, only use addition or multiplication
    if (mergedCells.length > 2 && (operation === 'subtract' || operation === 'divide')) {
      operation = Math.random() < 0.5 ? 'add' : 'multiply';
    }
    
    // Calculate the target number based on the operation
    switch (operation) {
      case 'add':
        targetNumber = cellValues.reduce((a, b) => a + b, 0);
        break;
      case 'subtract':
        // For subtraction, find the largest number and subtract the rest
        targetNumber = Math.max(...cellValues) - cellValues.reduce((sum, val) => {
          if (val !== Math.max(...cellValues)) return sum + val;
          return sum;
        }, 0);
        break;
      case 'multiply':
        targetNumber = cellValues.reduce((a, b) => a * b, 1);
        break;
      case 'divide':
        // For division, find the largest number and divide by the rest
        // Make sure division results in an integer
        // Sort in descending order
        cellValues.sort((a, b) => b - a);
        // Start with the largest value
        targetNumber = cellValues[0];
        // Divide by all other values
        for (let i = 1; i < cellValues.length; i++) {
          targetNumber /= cellValues[i];
        }
        // Skip if not an integer
        if (!Number.isInteger(targetNumber)) {
          operation = 'multiply';
          targetNumber = cellValues.reduce((a, b) => a * b, 1);
        }
        break;
    }
    
    // Create the new merged cage
    const newCage = {
      id: currentCageId,
      cells: mergedCells,
      operation: operation,
      targetNumber: targetNumber
    };
    
    // Update cell to cage mapping
    for (const cell of mergedCells) {
      cellToCage[cell.row][cell.col] = currentCageId;
    }
    
    // Remove the old cages and add the new one
    cages = cages.filter(cage => cage.id !== currentCageId && cage.id !== neighborCageId);
    cages.push(newCage);
  }
  
  return cages;
}

// Generate a complete Mathdoku puzzle
function generatePuzzle(size) {
  // Validate size
  if (size < 3 || size > 9) {
    throw new Error('Puzzle size must be between 3 and 9');
  }
  
  // Generate the solution grid (Latin square)
  const solutionGrid = generateLatinSquare(size);
  
  // Generate cages with operations and target numbers
  const cages = generateCages(size, solutionGrid);
  
  // Convert to client-friendly format
  const formattedCages = cages.map(cage => ({
    id: cage.id,
    cells: cage.cells,
    operation: cage.operation,
    targetNumber: cage.targetNumber
  }));
  
  return {
    size,
    cages: formattedCages,
    solution: solutionGrid
  };
}

// Create a simple puzzle for testing
function createSimplePuzzle(size) {
  const puzzle = generatePuzzle(size);
  return puzzle;
}

module.exports = {
  generatePuzzle,
  createSimplePuzzle
}; 