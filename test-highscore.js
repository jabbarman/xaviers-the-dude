// Test script for high score functionality

// Clear existing high scores for testing
localStorage.removeItem('highScores');

// Set up test scores
const testScores = [
  { score: 5000, initials: 'AAA' },
  { score: 4000, initials: 'BBB' },
  { score: 3000, initials: 'CCC' },
  { score: 2000, initials: 'DDD' },
  { score: 1000, initials: 'EEE' }
];

// Save test scores to localStorage
localStorage.setItem('highScores', JSON.stringify(testScores));

// Function to display current high scores
function displayHighScores() {
  const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
  console.log('Current High Scores:');
  highScores.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.score} - ${entry.initials}`);
  });
}

// Display initial high scores
console.log('Initial high scores:');
displayHighScores();

// Test adding a new high score
function testAddHighScore(score, initials) {
  console.log(`\nTesting adding score: ${score}, initials: ${initials}`);
  
  // Get current high scores
  let highScores = JSON.parse(localStorage.getItem('highScores')) || [];
  
  // Check if score qualifies
  let scorePosition = -1;
  for (let i = 0; i < highScores.length; i++) {
    if (score > highScores[i].score) {
      scorePosition = i;
      break;
    }
  }
  
  // If score qualifies, insert it
  if (scorePosition !== -1) {
    console.log(`Score qualifies at position ${scorePosition + 1}`);
    highScores.splice(scorePosition, 0, { score, initials });
    highScores = highScores.slice(0, 5); // Keep only top 5
    localStorage.setItem('highScores', JSON.stringify(highScores));
  } else {
    console.log('Score does not qualify for high scores');
  }
  
  // Display updated high scores
  displayHighScores();
}

// Test cases
testAddHighScore(4500, 'NEW'); // Should be inserted at position 2
testAddHighScore(6000, 'TOP'); // Should be inserted at position 1
testAddHighScore(500, 'LOW');  // Should not qualify
testAddHighScore(2500, 'MID'); // Should be inserted at position 4

// Test default values
console.log('\nTesting with empty localStorage:');
localStorage.removeItem('highScores');
const emptyScores = JSON.parse(localStorage.getItem('highScores')) || [];
console.log('Empty high scores length:', emptyScores.length);

// Function to load high scores with defaults
function loadHighScoresWithDefaults() {
  let highScores = [];
  try {
    const storedScores = localStorage.getItem('highScores');
    if (storedScores) {
      highScores = JSON.parse(storedScores);
    }
  } catch (e) {
    console.error('Error loading high scores:', e);
  }
  
  // Ensure we have 5 entries with defaults
  while (highScores.length < 5) {
    highScores.push({ score: 1000, initials: 'UNK' });
  }
  
  // Sort by score
  highScores.sort((a, b) => b.score - a.score);
  
  return highScores.slice(0, 5);
}

const defaultScores = loadHighScoresWithDefaults();
console.log('High scores with defaults:');
defaultScores.forEach((entry, index) => {
  console.log(`${index + 1}. ${entry.score} - ${entry.initials}`);
});

console.log('\nTest completed!');