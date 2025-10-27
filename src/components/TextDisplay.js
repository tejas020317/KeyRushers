// frontend/src/components/TextDisplay.js
import React from "react";
import "./TextDisplay.css";

// Memoized component for rendering a single character
// Prevents unnecessary re-renders of individual characters
const Char = React.memo(({ char, state, hasCaret }) => {
  return (
    <span className={`char ${state}`}>
      {/* Render the caret *inside* the character span */}
      {/* It will be positioned absolutely relative to this span */}
      {hasCaret && <span className="caret" aria-hidden />}
      {/* Render the character itself */}
      {char}
    </span>
  );
});

// Memoized component for rendering a single word
// Prevents unnecessary re-renders of entire words unless their state changes
const Word = React.memo(({ word, wordIndex, currentInput, results, typedHistory, isCurrentWord }) => {
  // Split the expected word into an array of characters
  const expectedChars = word.split("");

  // --- Logic for rendering a word that has already been typed ---
  if (results[wordIndex] !== undefined) { // Check if results exist for this index
    const charResults = results[wordIndex] || []; // Get correctness array (true/false)
    const typed = typedHistory[wordIndex] ?? ""; // Get the actual word typed
    // Find any extra characters typed beyond the expected word length
    const extras = typed.length > expectedChars.length ? typed.slice(expectedChars.length).split("") : [];

    // Apply a general class to the word span based on overall correctness (optional)
    const wordCorrect = expectedChars.length === typed.length && charResults.every(Boolean);
    const wordClassName = wordCorrect ? 'word-correct' : 'word-incorrect'; // You can define these in CSS if needed

    return (
      <span className={`word-completed ${wordClassName}`}>
        {/* Render the expected characters with correct/incorrect status */}
        {expectedChars.map((char, i) => (
          <Char
            key={`comp-${i}`}
            char={char}
            // Determine class based on correctness from results array
            state={charResults[i] === true ? 'correct-char' : 'incorrect-char'}
            hasCaret={false} // No caret on completed words
          />
        ))}
        {/* Render any extra characters typed in red */}
        {extras.map((char, i) => (
          <Char
            key={`extra-${i}`}
            char={char}
            state="incorrect-char extra-char" // Add extra-char class for specific styling
            hasCaret={false}
          />
        ))}
      </span>
    );
  }

  // --- Logic for rendering the word currently being typed ---
  if (isCurrentWord) {
    const typedChars = currentInput.split("");
    // Determine the maximum length needed for rendering (includes caret position)
    const maxLen = Math.max(expectedChars.length, typedChars.length);

    return (
      <span className="word-active">
        {/* Render characters up to max length + 1 (for potential caret at end) */}
        {Array.from({ length: maxLen + 1 }).map((_, i) => {
          const typedChar = typedChars[i];
          const expectedChar = expectedChars[i];
          // The caret appears at the position equal to the current input length
          const hasCaret = i === typedChars.length;

          let state = 'pending'; // Default state for un-typed characters
          let charToRender = expectedChar; // Default character to show

          if (typedChar != null) {
            // Character at this position has been typed
            if (expectedChar != null) {
              // It's within the expected word length
              state = (typedChar === expectedChar) ? 'correct-char' : 'incorrect-char';
            } else {
              // It's an extra character typed beyond the expected word length
              state = 'incorrect-char extra-char';
              charToRender = typedChar; // Show the character the user actually typed
            }
          } else {
              // Character has not been typed yet
              if (expectedChar == null && !hasCaret) {
                  // Don't render invisible placeholder characters beyond the word + caret
                  return null;
              }
              // If expected character exists, render it in pending state
              charToRender = expectedChar;
              // If this is the caret position beyond the expected word, render nothing but allow caret
              if (expectedChar == null && hasCaret) {
                  charToRender = ''; // Render empty space for caret
              }
          }

          // Render the character component (even if empty, for the caret)
          return (
            <Char
              key={`active-${i}`}
              char={charToRender}
              state={state}
              hasCaret={hasCaret}
            />
          );
        })}
      </span>
    );
  }

  // --- Logic for rendering words that haven't been reached yet ---
  return (
    <span className="word-pending">
      {/* Simply render the characters of the upcoming word in pending state */}
      {expectedChars.map((char, i) => (
        <Char key={`pend-${i}`} char={char} state="pending" hasCaret={false} />
      ))}
    </span>
  );
});

// --- The main TextDisplay component that arranges words into lines ---
export default function TextDisplay({
  visibleWords = [], // The subset of words currently shown on screen
  windowStart = 0,   // The global index of the first visible word in the full list
  wordIndex = 0,     // The global index of the word currently being typed
  currentInput = "", // The current content of the hidden input field
  results = {},      // Map of wordIndex -> array of char correctness (true/false)
  typedHistory = {}, // Map of wordIndex -> the actual word string typed by the user
  wordsPerLine = 10, // How many words before wrapping (for visual line breaking)
  onClick = () => {} // Function to call when the display area is clicked (usually to focus input)
}) {
  // Split the visible words into multiple lines for rendering
  const lines = [];
  if (visibleWords && visibleWords.length > 0) {
      for (let i = 0; i < visibleWords.length; i += wordsPerLine) {
        lines.push(visibleWords.slice(i, i + wordsPerLine));
      }
  }


  return (
    // The main container div for the text display area
    <div className="text-display big-box" onClick={onClick} role="article" aria-label="Text to type">
      {/* Map over each calculated line */}
      {lines.map((line, li) => {
        // Calculate the starting global index for the words in this line
        const lineStartGlobal = windowStart + li * wordsPerLine;
        return (
          // Div representing one line of words
          <div className="line" key={`line-${li}`}>
            {/* Map over each word in the current line */}
            {line.map((w, wi) => {
              // Calculate the global index for this specific word
              const globalIndex = lineStartGlobal + wi;
              // Ensure word is a string before rendering
              const wordString = typeof w === 'string' ? w : '';

              return (
                // Span wrapper for each word (crucial for inline-block spacing)
                <span className="word-wrapper" key={`word-${globalIndex}`}>
                  <Word
                    word={wordString} // Pass the validated word string
                    wordIndex={globalIndex} // Pass global index
                    currentInput={currentInput}
                    results={results}
                    typedHistory={typedHistory}
                    // Pass whether this is the word currently being typed
                    isCurrentWord={globalIndex === wordIndex}
                  />
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}