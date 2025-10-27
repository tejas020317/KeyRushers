// frontend/src/components/analytics.js
import React from 'react';

// --- 1. Key-to-Finger Mapping ---

export const FINGER_NAMES = {
  L_PINKY: "Left Pinky",
  L_RING: "Left Ring",
  L_MIDDLE: "Left Middle",
  L_INDEX: "Left Index",
  R_INDEX: "Right Index",
  R_MIDDLE: "Right Middle",
  R_RING: "Right Ring",
  R_PINKY: "Right Pinky",
  THUMB: "Thumb",
  UNKNOWN: "Other"
};

// Standard QWERTY layout mapping
const keyToFingerMap = {
  // Left Hand
  'q': 'L_PINKY', 'a': 'L_PINKY', 'z': 'L_PINKY', '1': 'L_PINKY', '`': 'L_PINKY',
  'w': 'L_RING', 's': 'L_RING', 'x': 'L_RING', '2': 'L_RING',
  'e': 'L_MIDDLE', 'd': 'L_MIDDLE', 'c': 'L_MIDDLE', '3': 'L_MIDDLE',
  'r': 'L_INDEX', 'f': 'L_INDEX', 'v': 'L_INDEX', '4': 'L_INDEX',
  't': 'L_INDEX', 'g': 'L_INDEX', 'b': 'L_INDEX', '5': 'L_INDEX',

  // Right Hand
  'y': 'R_INDEX', 'h': 'R_INDEX', 'n': 'R_INDEX', '6': 'R_INDEX',
  'u': 'R_INDEX', 'j': 'R_INDEX', 'm': 'R_INDEX', '7': 'R_INDEX',
  'i': 'R_MIDDLE', 'k': 'R_MIDDLE', ',': 'R_MIDDLE', '8': 'R_MIDDLE',
  'o': 'R_RING', 'l': 'R_RING', '.': 'R_RING', '9': 'R_RING',
  'p': 'R_PINKY', ';': 'R_PINKY', '/': 'R_PINKY', '0': 'R_PINKY',
  '[': 'R_PINKY', "'": 'R_PINKY', '-': 'R_PINKY', '=': 'R_PINKY',
  ']': 'R_PINKY', '\\': 'R_PINKY',

  // Thumbs
  ' ': 'THUMB'
};

const getFinger = (key) => {
  // Ensure key is valid before accessing toLowerCase
  if (!key || typeof key !== 'string') {
      return 'UNKNOWN';
  }
  return keyToFingerMap[key.toLowerCase()] || 'UNKNOWN';
};


// --- 2. Analysis Logic ---

/**
 * Analyzes test results to provide per-finger stats and a list of all mistakes.
 * @param {object} results - Map of wordIndex -> array of char correctness (true/false).
 * @param {object} typedHistory - Map of wordIndex -> the actual word typed by the user.
 * @param {string[]} words - The array of *all* words presented in the test.
 * @returns {{fingerStats: object, mistypedLetters: string[]}}
 */
export function analyzeTestResults(results, typedHistory, words) {
  // Initialize stats object for each finger
  const fingerStats = {};
  for (const key in FINGER_NAMES) {
    fingerStats[key] = { correct: 0, total: 0, errors: {} };
  }
  const mistypedLetters = []; // Letters the user *should have* typed but didn't

  // Iterate only over the words the user actually attempted to type
  // Use the maximum index from results or history to determine attempt count
  const wordsAttemptedCount = Math.max(
       Object.keys(results).length ? Math.max(...Object.keys(results).map(Number)) + 1 : 0,
       Object.keys(typedHistory).length ? Math.max(...Object.keys(typedHistory).map(Number)) + 1 : 0
   );


  for (let i = 0; i < wordsAttemptedCount; i++) {
    const expectedWord = words[i];
    // Skip if the expected word is somehow missing for this index
    if (!expectedWord) continue;

    const typedWord = typedHistory[i] || "";
    // Ensure results has an entry, default to empty array if needed
    const charResults = results[i] || Array(expectedWord.length).fill(false);

    // Analyze each character in the *expected* word
    for (let j = 0; j < expectedWord.length; j++) {
      const expectedChar = expectedWord[j];
      const typedChar = typedWord[j]; // The char the user actually typed at this position
      const finger = getFinger(expectedChar); // The finger that *should* have typed this char

      // Skip characters not mapped to a finger (like Shift, etc.)
      if (finger === 'UNKNOWN') continue;

      // Increment total attempts for the assigned finger
      fingerStats[finger].total++;

      // Check if the character was typed correctly (using charResults array)
      if (charResults[j] === true) {
        fingerStats[finger].correct++;
      } else {
        // This character was an error or not typed
        mistypedLetters.push(expectedChar); // Add to list for the backend model

        // If a character was actually typed at this position (could be undefined)
        if (typedChar) {
          const errorFinger = getFinger(typedChar); // Which finger was *actually* used
          if (errorFinger !== 'UNKNOWN') {
            // Record the specific confusion (e.g., L_INDEX was expected, but R_MIDDLE was used)
            fingerStats[finger].errors[errorFinger] = (fingerStats[finger].errors[errorFinger] || 0) + 1;
          }
        }
      }
    }

    // Assume spacebar was hit correctly if the word was attempted (moved to next)
    // Add check if THUMB exists and word was attempted
    if (fingerStats.THUMB && typedHistory[i] !== undefined) {
      fingerStats.THUMB.total++;
      // A more complex system would track spacebar errors too
      // For now, assume correct if word was submitted
      fingerStats.THUMB.correct++;
    }
  }

  return { fingerStats, mistypedLetters };
}


// --- 3. Cumulative Stats Functions (for Practice Mode) ---

// Use a specific key for practice stats in localStorage
const PRACTICE_STATS_KEY = 'practiceCumulativeFingerStats';

/**
 * Loads the cumulative finger stats FOR PRACTICE MODE from localStorage.
 * ALWAYS initializes a full stats object with 0s if none are found or invalid.
 * @returns {object} The cumulative finger stats object for practice mode.
 */
export function loadPracticeFingerStats() {
  // Always start with a fresh, zeroed-out structure
  const initialStats = {};
  for (const key in FINGER_NAMES) {
    initialStats[key] = { correct: 0, total: 0 };
  }

  try {
    const savedStats = localStorage.getItem(PRACTICE_STATS_KEY);
    if (savedStats) {
      const parsedStats = JSON.parse(savedStats);
      // Merge saved data into the initial structure, only keeping valid keys
      // This prevents issues if FINGER_NAMES changes or saved data is corrupted
      for (const key in initialStats) {
          if (parsedStats[key] && typeof parsedStats[key].correct === 'number' && typeof parsedStats[key].total === 'number') {
              initialStats[key] = parsedStats[key];
          }
      }
      console.log("Loaded Practice Stats:", initialStats); // Log loaded data
      return initialStats; // Return potentially merged stats
    }
  } catch (e) {
    console.error("Failed to load or parse practice cumulative stats:", e);
    // Fall through to return the initial zeroed stats
  }
  // Return the initial zeroed stats if nothing loaded or error occurred
  console.log("Initialized Practice Stats:", initialStats); // Log initialized data
  return initialStats;
}

/**
 * Updates the cumulative finger stats FOR PRACTICE MODE in localStorage
 * by adding the results from the latest practice test.
 * @param {object} latestFingerStats - The fingerStats object from the most recent practice test.
 */
export function updatePracticeCumulativeStats(latestFingerStats) {
  // Ensure we have valid stats from the latest test
  if (!latestFingerStats || typeof latestFingerStats !== 'object') {
      console.error("Invalid latestFingerStats provided for update.");
      return;
  }

  // Load the current cumulative stats
  const cumulativeStats = loadPracticeFingerStats();

  // Add the counts from the latest test to the cumulative totals
  for (const fingerId in latestFingerStats) {
    // Check if the fingerId from latest stats exists in our FINGER_NAMES and cumulativeStats
    if (FINGER_NAMES[fingerId] && cumulativeStats[fingerId]) {
      cumulativeStats[fingerId].correct += latestFingerStats[fingerId].correct || 0; // Add 0 if undefined
      cumulativeStats[fingerId].total += latestFingerStats[fingerId].total || 0; // Add 0 if undefined
    } else if (FINGER_NAMES[fingerId]) {
         // If a finger somehow wasn't initialized in cumulative, add it now
         console.warn(`Finger ${fingerId} not found in cumulative stats, initializing.`);
         cumulativeStats[fingerId] = {
             correct: latestFingerStats[fingerId].correct || 0,
             total: latestFingerStats[fingerId].total || 0
         };
     }
  }

  // Save the updated cumulative stats back to localStorage under the specific key
  try {
    localStorage.setItem(PRACTICE_STATS_KEY, JSON.stringify(cumulativeStats)); // Use specific key
    console.log("Updated PRACTICE cumulative stats:", cumulativeStats);
  } catch (e) {
    console.error("Failed to save practice cumulative stats:", e);
  }
}

/**
 * Resets the cumulative practice finger stats in localStorage.
 * @returns {object | null} A new zeroed stats object on success, or null on failure.
 */
export function resetPracticeFingerStats() {
    try {
        localStorage.removeItem(PRACTICE_STATS_KEY); // Remove the item
        console.log("Reset PRACTICE cumulative stats.");
        // Return a new zeroed object so the UI can update immediately
        const initialStats = {};
         for (const key in FINGER_NAMES) {
           initialStats[key] = { correct: 0, total: 0 };
         }
         return initialStats;
    } catch (e) {
        console.error("Failed to reset practice cumulative stats:", e);
        // Return null or empty object on failure if preferred
         return null;
    }
}


// --- 4. Chart Components ---

// Chart 1: Finger Accuracy
export const FingerAccuracyChart = ({ stats }) => {
   // Ensure stats object exists and is not empty
   if (!stats || Object.keys(stats).length === 0) {
        return <p>No finger data available.</p>;
   }

   // Filter out fingers with zero total attempts before rendering
    const validFingers = Object.entries(stats).filter(([, data]) => data && data.total > 0);

    if (validFingers.length === 0) {
        return <p className="no-stats-message">No finger activity recorded yet in Practice Mode.</p>; // Use class
    }

  return (
    <div className="chart-container">
      {/* Remove the redundant h3 if StatsPage provides it */}
      {/* <h3>Finger Accuracy</h3> */}
      {/* Sort fingers for consistent display order (optional but recommended) */}
      {validFingers
       .sort(([keyA], [keyB]) => { // Basic sort: L Pinky -> R Pinky -> Thumb -> Unknown
           const order = ['L_PINKY', 'L_RING', 'L_MIDDLE', 'L_INDEX', 'R_INDEX', 'R_MIDDLE', 'R_RING', 'R_PINKY', 'THUMB', 'UNKNOWN'];
           return order.indexOf(keyA) - order.indexOf(keyB);
       })
       .map(([fingerId, data]) => {
         // Calculate accuracy (handle division by zero just in case)
        const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;

        return (
          <div className="chart-row" key={fingerId}>
            <div className="chart-label">{FINGER_NAMES[fingerId] || fingerId}</div> {/* Fallback label */}
            <div className="chart-bar-container">
              <div
                className="chart-bar"
                style={{
                  width: `${accuracy}%`,
                  // Color codes: Green >= 80, Yellow >= 50, Red < 50
                  backgroundColor: accuracy >= 80 ? '#22c55e' : (accuracy >= 50 ? '#f59e0b' : '#ef4444')
                }}
              />
            </div>
            <div className="chart-value">{accuracy}%</div>
          </div>
        );
      })}
    </div>
  );
};

// Chart 2: Finger Confusion (with varied sentences)
export const FingerConfusionChart = ({ stats }) => {
    // Ensure stats object exists before proceeding
    if (!stats) return null;

  // Get top 3 problem fingers (the ones that *should* have been used)
  const topProblemFingers = Object.entries(stats)
    .filter(([, data]) => data && data.total > 0 && data.total > data.correct) // Has errors
    .sort(([, a], [, b]) => (b.total - b.correct) - (a.total - a.correct)) // Sort by most errors
    .slice(0, 3); // Get top 3

  if (topProblemFingers.length === 0) {
    return (
      <div className="chart-container">
        <h3>Common Mistakes</h3>
        <p className="confusion-text">No significant finger errors recorded! Great job! 👍</p>
      </div>
    );
  }

  // Function to generate different sentences based on the finger
  const generateMistakeSentence = (intendedFingerId, mistakeData) => {
    // Find the finger that was most *incorrectly used* instead
    // Ensure mistakeData.errors exists and is an object
    const errorsObject = mistakeData.errors || {};
    const mistakes = Object.entries(errorsObject)
      .sort(([, aCount], [, bCount]) => bCount - aCount); // Sort by count desc

    const topMistakeFingerId = mistakes.length > 0 ? mistakes[0][0] : null;
    // Provide a fallback name if no specific error finger was recorded
    const topMistakeFingerName = topMistakeFingerId ? (FINGER_NAMES[topMistakeFingerId] || 'Unknown Finger') : "a different key";
    const intendedFingerName = FINGER_NAMES[intendedFingerId] || 'Unknown Finger'; // Fallback name

    // Customize the sentence based on the intended finger
    switch (intendedFingerId) {
      case 'L_PINKY':
      case 'R_PINKY':
        return `Your **${intendedFingerName}** sometimes missed its keys, often hitting ones meant for the **${topMistakeFingerName}**.`;
      case 'L_RING':
      case 'R_RING':
        return `It looks like your **${intendedFingerName}** occasionally strayed, frequently using the **${topMistakeFingerName}** instead.`;
      case 'L_MIDDLE':
      case 'R_MIDDLE':
        return `When aiming for **${intendedFingerName}** keys, you sometimes used your **${topMistakeFingerName}** by mistake.`;
      case 'L_INDEX':
      case 'R_INDEX':
        return `Your **${intendedFingerName}** seems quite active! It sometimes hit keys assigned to the **${topMistakeFingerName}**.`;
      case 'THUMB':
         // Check if there were actually errors recorded for the thumb
         if (mistakes.length > 0) {
             return `Interestingly, when you should have used your **${intendedFingerName}** (for space), you sometimes hit a key meant for the **${topMistakeFingerName}**.`;
         } else {
             // Provide a more generic message if no specific thumb errors recorded
             return `Your **${intendedFingerName}** (for space) seems generally accurate, but double-check your positioning.`;
         }
      default: // Includes UNKNOWN or any unexpected fingerId
        return `For keys meant for the **${intendedFingerName}**, you most often used the **${topMistakeFingerName}** instead.`;
    }
  };

  return (
    <div className="chart-container">
      <h3>Common Mistakes</h3>
      {topProblemFingers.map(([fingerId, data]) => (
        // Ensure data is valid before generating sentence
        data ? (
             <p key={fingerId} className="confusion-text">
               {generateMistakeSentence(fingerId, data)}
             </p>
        ) : null
      ))}
    </div>
  );
};