// frontend/src/components/PracticeBox.js
import React, { useEffect, useRef, useState } from "react";
import TextDisplay from "./TextDisplay";
import ResultsModal from "./ResultsModal";
// Import analytics functions, including the practice stats updater
import { analyzeTestResults, updatePracticeCumulativeStats } from "./analytics";
import "./TextDisplay.css";
import "./TypingBoxExtras.css";

// Funny encouragement messages
const FUNNY_MESSAGES = [
  "Whoa there! Even keyboards need a break 💥",
  "15 mistakes? That's a new record! Try again? 🎯",
  "Your keyboard is sending SOS signals 🆘",
  "Plot twist: The words are winning! Round 2? 🥊",
  "Error 404: Accuracy not found. Let's fix that! 🔧",
  "Typo tornado detected! Let's calm it down 🌪️",
  "Your fingers are having a party. Time to focus? 🎉",
  "The backspace key is crying. Let's give it a rest! ⌨️",
  "15 wrongs don't make a right, but they make a great comeback story! 💪",
  "Oops! Let's pretend that didn't happen and try again 😅"
];

// Bomb Animation Component
function BombAnimation({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="bomb-overlay">
      <div className="bomb-container">
        <div className="bomb-emoji">💣</div>
        <div className="bomb-explosion">💥</div>
        <div className="bomb-message">{message}</div>
        <button className="bomb-close-btn" onClick={onClose}>
          Let's Try Again! 🚀
        </button>
      </div>
    </div>
  );
}

export default function PracticeBox() {
  // ---------- Persisted timer helpers ----------
  const readSavedTime = () => {
    try {
      const raw = window.localStorage.getItem("practice.timer.seconds");
      const parsed = raw ? JSON.parse(raw) : null;
      if (typeof parsed === "number" && parsed > 0) return parsed;
    } catch {}
    return 60; // default
  };

  // State variables for the component
  const [words, setWords] = useState([]); // Words fetched from backend
  const [wordIndex, setWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const [results, setResults] = useState({}); // Stores correctness for each char
  const [typedHistory, setTypedHistory] = useState({}); // Stores the exact word typed

  // Initialize totalTime/timeLeft from storage
  const [totalTime, setTotalTime] = useState(readSavedTime());
  const [timeLeft, setTimeLeft] = useState(readSavedTime());

  const [running, setRunning] = useState(false); // Is the test currently active?
  const [showModal, setShowModal] = useState(false); // Is the results modal visible?
  const [isLoading, setIsLoading] = useState(true); // Is data being fetched?
  const [analysisResults, setAnalysisResults] = useState(null); // Finger analysis data for modal

  // Keystroke tracking for accuracy calculation
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [incorrectKeystrokes, setIncorrectKeystrokes] = useState(0);

  // Bomb animation states
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [consecutiveWrongChars, setConsecutiveWrongChars] = useState(0);
  const [showBomb, setShowBomb] = useState(false);
  const [bombMessage, setBombMessage] = useState('');

  // Ref for the hidden input field
  const hiddenRef = useRef(null);

  // Guard to avoid duplicate fetch when timer effect also runs
  const pendingTimerResetRef = useRef(false);

  // ---------- Persist totalTime whenever it changes ----------
  useEffect(() => {
    try {
      window.localStorage.setItem(
        "practice.timer.seconds",
        JSON.stringify(totalTime)
      );
    } catch {}
  }, [totalTime]);

  // --- Fetch Test Data from Backend and Reset State ---
  const fetchTest = async () => {
    setIsLoading(true);
    // Reset all states relevant to a single test run
    setWords([]);
    setWordIndex(0);
    setCurrentInput("");
    setResults({});
    setTypedHistory({});
    setAnalysisResults(null);
    setTimeLeft(totalTime); // Reset timer based on current (persisted) selection
    setRunning(false);
    setTotalKeystrokes(0);
    setIncorrectKeystrokes(0);
    setConsecutiveWrong(0);
    setConsecutiveWrongChars(0);

    try {
      // API call to the Python backend
      const response = await fetch("http://127.0.0.1:5000/api/get_test");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setWords(data); // Update state with fetched words
    } catch (error) {
      console.error("Failed to fetch typing test:", error);
      // Provide fallback words in case of server error
      setWords(["server", "error", "please", "check", "backend", "connection"]);
    }
    setIsLoading(false);
    setTimeout(() => hiddenRef.current?.focus(), 50);
  };

  // Helper used when changing timer mid-run (match TypingBox behavior)
  const resetAndRefetch = async () => {
    setIsLoading(true);
    // stop run and clear state
    setRunning(false);
    setWordIndex(0);
    setCurrentInput("");
    setResults({});
    setTypedHistory({});
    setAnalysisResults(null);
    setTotalKeystrokes(0);
    setIncorrectKeystrokes(0);
    setConsecutiveWrong(0);
    setConsecutiveWrongChars(0);
    setShowModal(false);
    // timeLeft already set by caller

    try {
      const response = await fetch("http://127.0.0.1:5000/api/get_test");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setWords(data);
    } catch (error) {
      console.error("Failed to fetch typing test:", error);
      setWords(["server", "error", "please", "check", "backend", "connection"]);
    } finally {
      setIsLoading(false);
      setTimeout(() => hiddenRef.current?.focus(), 50);
    }
  };

  // Fetch the first test when the component initially mounts
  useEffect(() => {
    fetchTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount

  // Re-fetch words when timer duration changes AFTER initial load (only when not explicitly reset)
  useEffect(() => {
    if (!isLoading && !running && !pendingTimerResetRef.current) {
      fetchTest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalTime]);

  // Focus the hidden input field once the test data is loaded
  useEffect(() => {
    if (!isLoading) setTimeout(() => hiddenRef.current?.focus(), 50);
  }, [isLoading]);

  // --- Timer Logic ---
  useEffect(() => {
    // Don't run timer if test isn't running, is loading, or time is already up
    if (!running || isLoading || timeLeft <= 0) return;

    // Set up an interval to decrease timeLeft every second
    const id = setInterval(
      () => setTimeLeft((t) => Math.max(0, t - 1)),
      1000
    );

    // Cleanup
    return () => clearInterval(id);
  }, [running, timeLeft, isLoading]);

  // --- End-of-Test Logic (Analysis and Mistake Logging) ---
  useEffect(() => {
    // Check if the timer just hit 0 AND the test was running
    if (timeLeft === 0 && running) {
      setRunning(false); // Stop the test

      // Analyze the user's performance for this test run
      const { fingerStats, mistypedLetters } = analyzeTestResults(
        results,
        typedHistory,
        words
      );

      setAnalysisResults(fingerStats); // Save analysis stats for the results modal

      // Update Cumulative Practice Stats
      updatePracticeCumulativeStats(fingerStats);

      // Send all the mistakes made during the test back to the Python server
      if (mistypedLetters.length > 0) {
        fetch("http://127.0.0.1:5000/api/log_mistake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ letters: mistypedLetters }),
        }).catch((err) => console.error("Failed to log mistakes:", err));
      }

      setShowModal(true); // Show the results modal
    }
  }, [timeLeft, running, results, typedHistory, words]);

  // --- Input Handling ---
  const handleHiddenChange = (e) => {
    const newValue = e.target.value;
    const oldValue = currentInput;

    if (!isLoading && (running || newValue.length > 0)) {
      if (!running && newValue.length > 0) {
        setRunning(true);
      }

      // Check for wrong characters WHILE TYPING (before space)
      const expected = (words[wordIndex] || '').toLowerCase();
      const typingValue = newValue.toLowerCase();
      let wrongCharsWhileTyping = 0;
      
      for (let i = 0; i < typingValue.length; i++) {
        if (typingValue[i] !== expected[i]) {
          wrongCharsWhileTyping++;
        }
      }
      
      // Also count extra characters beyond expected length
      if (typingValue.length > expected.length) {
        wrongCharsWhileTyping += (typingValue.length - expected.length);
      }
      
      console.log('Typing:', typingValue, 'Expected:', expected, 'Wrong chars:', wrongCharsWhileTyping, 'Consecutive:', consecutiveWrongChars + wrongCharsWhileTyping);
      
      // Trigger bomb if 15+ wrong chars accumulated while typing
      if ((consecutiveWrongChars + wrongCharsWhileTyping) >= 15) {
        console.log('💣 BOMB! Too many wrong chars while typing!');
        const randomMsg = FUNNY_MESSAGES[Math.floor(Math.random() * FUNNY_MESSAGES.length)];
        setBombMessage(randomMsg);
        setShowBomb(true);
        setRunning(false);
        setConsecutiveWrong(0);
        setConsecutiveWrongChars(0);
        setCurrentInput('');
        return; // Stop processing
      }

      // Keystroke and error counting
      if (newValue.length > oldValue.length) {
        setTotalKeystrokes((prev) => prev + 1);

        const currentExpectedWord = words[wordIndex] || "";
        const charIndex = newValue.length - 1;
        const typedChar = newValue[charIndex];
        const expectedChar = currentExpectedWord[charIndex];

        if (charIndex < currentExpectedWord.length && typedChar !== expectedChar) {
          setIncorrectKeystrokes((prev) => prev + 1);
        } else if (charIndex >= currentExpectedWord.length) {
          setIncorrectKeystrokes((prev) => prev + 1);
        }
      }

      setCurrentInput(newValue);

      if (newValue.endsWith(" ")) {
        const typed = newValue.trim();
        const expectedWord = words[wordIndex] || "";

        const charResults = expectedWord.split("").map((ch, i) => typed[i] === ch);
        for (let i = expectedWord.length; i < typed.length; i++) {
          charResults[i] = false;
        }

        // Count wrong characters in completed word
        const wrongCharsInWord = charResults.filter(ok => ok === false).length;
        
        // Check if word is completely correct
        const isWordCorrect = typed === expectedWord;
        
        if (!isWordCorrect) {
          // Increment consecutive wrong words counter
          const newConsecutive = consecutiveWrong + 1;
          setConsecutiveWrong(newConsecutive);
          
          // Add wrong chars to consecutive counter
          const newConsecutiveWrongChars = consecutiveWrongChars + wrongCharsInWord;
          setConsecutiveWrongChars(newConsecutiveWrongChars);
          
          console.log('Wrong word!', {
            typed, 
            expectedWord, 
            wrongCharsInWord, 
            consecutiveWrongChars: newConsecutiveWrongChars,
            consecutiveWrongWords: newConsecutive
          });
          
          // Trigger bomb at 10 consecutive wrong words
          if (newConsecutive >= 10) {
            console.log('💣 BOMB TRIGGERED! (10 wrong words)');
            const randomMsg = FUNNY_MESSAGES[Math.floor(Math.random() * FUNNY_MESSAGES.length)];
            setBombMessage(randomMsg);
            setShowBomb(true);
            setRunning(false);
            setConsecutiveWrong(0);
            setConsecutiveWrongChars(0);
          }
        } else {
          // Reset both counters on correct word
          console.log('✅ Correct word! Resetting counters');
          setConsecutiveWrong(0);
          setConsecutiveWrongChars(0);
        }

        setResults((r) => ({ ...r, [wordIndex]: charResults }));
        setTypedHistory((t) => ({ ...t, [wordIndex]: typed }));
        setWordIndex((i) => i + 1);
        setCurrentInput("");
      }
    } else if (newValue.length < oldValue.length) {
      setCurrentInput(newValue);
    }
  };

  // Handles key presses, specifically for backspace to previous word
  const handleHiddenKeyDown = (e) => {
    if (e.key === "Backspace" && currentInput === "" && wordIndex > 0) {
      e.preventDefault();

      const prevWordIndex = wordIndex - 1;
      const prevTypedWord = typedHistory[prevWordIndex] || "";

      setWordIndex(prevWordIndex);
      setCurrentInput(prevTypedWord + " ");

      setResults((r) => {
        const nr = { ...r };
        delete nr[prevWordIndex];
        return nr;
      });
      setTypedHistory((t) => {
        const nt = { ...t };
        delete nt[prevWordIndex];
        return nt;
      });
    }
  };

  // --- Utility Functions ---
  const clearModal = () => setShowModal(false);

  const handleBombClose = () => {
    setShowBomb(false);
    setRunning(true); // Resume timer
    setTimeout(() => hiddenRef.current?.focus(), 100);
  };

  // Resets the test state and fetches new words from the backend
  const resetTest = () => {
    clearModal();
    fetchTest(); // Fetches new words AND resets all state including counters
  };

  // Assign resetTest to button handlers
  const handleRestart = resetTest;
  const handleNext = resetTest;

  // Handles changing the timer duration selection (immediate reset, like TypingBox)
  const handleTimeSelect = async (secs) => {
    if (secs === totalTime) return;
    setTotalTime(secs);  // persisted via effect
    setTimeLeft(secs);   // reflect immediately

    // Reset immediately without full page refresh
    pendingTimerResetRef.current = true;
    await resetAndRefetch();
    pendingTimerResetRef.current = false;
  };

  // --- Statistics Calculation (Calculated when modal is shown) ---
  const [stats, setStats] = useState({ wpm: 0, accuracy: 0 });

  useEffect(() => {
    if (showModal) {
      const elapsedMinutes = totalTime / 60;

      let correctCharsForWPM = 0;
      const wordsAttempted = wordIndex;
      for (let i = 0; i < wordsAttempted; i++) {
        const resultsForWord = results[i] || [];
        const typedWord = typedHistory[i] || "";
        const expectedWord = words[i] || "";

        correctCharsForWPM += resultsForWord.filter(
          (isCorrect, idx) => isCorrect && idx < expectedWord.length
        ).length;

        if (
          typedWord === expectedWord &&
          resultsForWord.length === expectedWord.length &&
          resultsForWord.every(Boolean)
        ) {
          correctCharsForWPM++;
        }
      }

      const netWpm =
        elapsedMinutes > 0
          ? Math.round(correctCharsForWPM / 5 / elapsedMinutes)
          : 0;

      const keystrokeAccuracy =
        totalKeystrokes > 0
          ? Math.round(
              ((totalKeystrokes - incorrectKeystrokes) / totalKeystrokes) * 100
            )
          : 0;

      const finalAccuracy = Math.max(0, Math.min(100, keystrokeAccuracy));

      setStats({
        wpm: netWpm,
        accuracy: finalAccuracy,
      });
    }
  }, [
    showModal,
    results,
    typedHistory,
    words,
    totalTime,
    wordIndex,
    totalKeystrokes,
    incorrectKeystrokes,
  ]);

  // Calculate progress bar percentage
  const progress =
    totalTime > 0 ? ((totalTime - Math.max(0, timeLeft)) / totalTime) * 100 : 0;

  // --- Render Logic ---
  if (isLoading) {
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "100px",
          fontSize: "24px",
          color: "var(--text)",
        }}
      >
        Loading practice test...
      </div>
    );
  }

  // Calculate which words are currently visible in the display box
  const wordsPerLine = 7;
  const visibleLines = 4;
  const visibleCount = wordsPerLine * visibleLines;
  const blockShift = wordsPerLine * 2; // How many words before scrolling
  const blockIndex = Math.floor(wordIndex / blockShift);
  const windowStart = Math.max(0, blockIndex * blockShift);
  const visibleWords = words.slice(windowStart, windowStart + visibleCount);

  return (
    <div className="typing-wrapper">
      {showBomb && <BombAnimation message={bombMessage} onClose={handleBombClose} />}
      
      {/* Top controls: Timer selection, Restart button, Time remaining */}
      <div className="controls-row">
        <div className="left-controls">
          <label className="timer-label">Timer:</label>
          <div className="timer-buttons">
            {[15, 30, 60, 120].map((t) => (
              <button
                key={t}
                className={`timer-btn ${t === totalTime ? "active" : ""}`}
                onClick={() => handleTimeSelect(t)}
              >
                {t}s
              </button>
            ))}
          </div>
        </div>
        <div className="right-controls">
          <button className="restart-btn" onClick={handleRestart}>
            Restart
          </button>
          <div className="time-display">{timeLeft}s</div>
        </div>
      </div>

      {/* Progress bar showing time elapsed */}
      <div className="progress-bar" aria-hidden>
        <div
          className={`progress-fill ${timeLeft <= 5 ? "warning" : ""}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* The main text display area */}
      <TextDisplay
        visibleWords={visibleWords}
        windowStart={windowStart}
        wordIndex={wordIndex}
        currentInput={currentInput}
        results={results}
        typedHistory={typedHistory}
        wordsPerLine={wordsPerLine}
        onClick={() => hiddenRef.current?.focus()}
      />

      {/* Hidden input field where the user actually types */}
      <input
        ref={hiddenRef}
        className="hidden-typing-input"
        aria-label="Type here"
        value={currentInput}
        onChange={handleHiddenChange}
        onKeyDown={handleHiddenKeyDown}
        disabled={timeLeft <= 0 || isLoading || showBomb}
        autoComplete="off"
        spellCheck="false"
        autoCapitalize="none"
        autoCorrect="off"
      />

      {/* The modal window that shows results */}
      <ResultsModal
        isOpen={showModal}
        wpm={stats.wpm}
        accuracy={stats.accuracy}
        actualAccuracy={stats.accuracy}
        fingerStats={analysisResults}
        onRepeat={handleRestart}
        onNext={handleNext}
        onClose={handleNext}
      />
    </div>
  );
}