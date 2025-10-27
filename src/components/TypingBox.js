import React, { useState, useEffect, useRef } from 'react';
import { submitScore } from '../api/scores';
import { auth } from '../firebase';
import TextDisplay from './TextDisplay';
import ResultsModal from './ResultsModal';
import './TypingBoxExtras.css';

// Short fallback words 3–6 letters
const FALLBACK_WORDS = [
  'the','and','for','are','but','not','you','all','can','her',
  'was','one','our','out','day','get','has','him','his','how',
  'man','new','now','old','see','two','way','who','boy','did',
  'its','let','put','say','she','too','use','back','door','down',
  'each','find','from','give','good','hand','have','here','just','know','like','look','made','make','more'
];

// Funny encouragement messages
const FUNNY_MESSAGES = [
  "Whoa there! Even keyboards need a break 💥",
  "10 mistakes? That's a new record! Try again? 🎯",
  "Your keyboard is sending SOS signals 🆘",
  "Plot twist: The words are winning! Round 2? 🥊",
  "Error 404: Accuracy not found. Let's fix that! 🔧",
  "Typo tornado detected! Let's calm it down 🌪️",
  "Your fingers are having a party. Time to focus? 🎉",
  "The backspace key is crying. Let's give it a rest! ⌨️",
  "10 wrongs don't make a right, but they make a great comeback story! 💪",
  "Oops! Let's pretend that didn't happen and try again 😅"
];

// Generate a target length pattern like [4,3,5,6,4,3,...]
function makeLengthPattern(count, min = 3, max = 6) {
  const arr = new Array(count);
  for (let i = 0; i < count; i++) {
    arr[i] = Math.floor(Math.random() * (max - min + 1)) + min;
  }
  return arr;
}

// Fetch a batch of words for a specific length from a fast endpoint
async function fetchByLength(len, count) {
  const url = `https://random-word-api.vercel.app/api?words=${count}&length=${len}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`vercel ${res.status}`);
  const data = await res.json();
  let words = (Array.isArray(data) ? data : []).map(w => String(w).toLowerCase());
  words = words.filter(w => /^[a-z]+$/.test(w) && w.length === len);
  return words;
}

// Build a mixed-length batch that follows a length pattern
async function fetchMixedBatch(totalCount) {
  const pattern = makeLengthPattern(totalCount, 3, 6);
  const need = {3:0,4:0,5:0,6:0};
  for (const L of pattern) need[L]++;

  const over = (n) => Math.max(n, 0) + Math.ceil((n || 0) * 0.25);

  let pool = {3:[],4:[],5:[],6:[]};

  const fetchBucket = async (L, n) => {
    if (n <= 0) return;
    const requested = over(n);
    try {
      pool[L] = (await fetchByLength(L, requested));
      if (pool[L].length < n) {
        const h = await fetch(`https://random-word-api.herokuapp.com/word?number=${requested}&length=${L}`);
        if (h.ok) {
          const j = await h.json();
          const extra = (Array.isArray(j) ? j : []).map(w => String(w).toLowerCase()).filter(w => /^[a-z]+$/.test(w) && w.length === L);
          pool[L] = pool[L].concat(extra);
        }
      }
      if (pool[L].length < n) {
        const r = await fetch(`https://random-word.ryanrk.com/api/en/word/random/${requested}?minlength=${L}&maxlength=${L}`);
        if (r.ok) {
          const jr = await r.json();
          const extra = (Array.isArray(jr) ? jr : []).map(w => String(w).toLowerCase()).filter(w => /^[a-z]+$/.test(w) && w.length === L);
          pool[L] = pool[L].concat(extra);
        }
      }
    } catch (_) {}
  };

  await Promise.all([
    fetchBucket(3, need[3]),
    fetchBucket(4, need[4]),
    fetchBucket(5, need[5]),
    fetchBucket(6, need[6]),
  ]);

  const fallbackByLen = (L) => {
    const filtered = FALLBACK_WORDS.filter(w => w.length === L);
    if (filtered.length === 0) return [];
    const out = [];
    const target = need[L] - (pool[L]?.length || 0);
    for (let i = 0; i < target; i++) out.push(filtered[Math.floor(Math.random() * filtered.length)]);
    return out;
  };

  for (const L of [3,4,5,6]) {
    if ((pool[L]?.length || 0) < need[L]) pool[L] = (pool[L] || []).concat(fallbackByLen(L));
    for (let i = pool[L].length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [pool[L][i], pool[L][j]] = [pool[L][j], pool[L][i]];
    }
  }

  const result = new Array(totalCount);
  const idx = {3:0,4:0,5:0,6:0};
  for (let i = 0; i < totalCount; i++) {
    const L = pattern[i];
    let w = pool[L][idx[L]];
    if (!w) {
      const options = FALLBACK_WORDS.filter(x => x.length === L);
      w = options.length ? options[Math.floor(Math.random() * options.length)] : FALLBACK_WORDS[Math.floor(Math.random() * FALLBACK_WORDS.length)];
    }
    result[i] = w;
    idx[L] = (idx[L] || 0) + 1;
  }
  return result;
}

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

export default function TypingBox() {
  const readSavedTime = () => {
    try {
      const raw = window.localStorage.getItem('typing.timer.seconds');
      const parsed = raw ? JSON.parse(raw) : null;
      if (typeof parsed === 'number' && parsed > 0) return parsed;
    } catch {}
    return 60;
  };

  const [totalTime, setTotalTime] = useState(readSavedTime());
  const [timeLeft, setTimeLeft] = useState(readSavedTime());
  const [running, setRunning] = useState(false);

  const wordsPerLine = 9;
  const visibleLines = 4;
  const INITIAL_WORDS = wordsPerLine * visibleLines;
  const FETCH_MORE_WORDS = wordsPerLine * 3;

  const [words, setWords] = useState([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [results, setResults] = useState({});
  const [typedHistory, setTypedHistory] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [submittedRun, setSubmittedRun] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [consecutiveWrongChars, setConsecutiveWrongChars] = useState(0);
  const [showBomb, setShowBomb] = useState(false);
  const [bombMessage, setBombMessage] = useState('');
  const hiddenRef = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem('typing.timer.seconds', JSON.stringify(totalTime));
    } catch {}
  }, [totalTime]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const batch = await fetchMixedBatch(INITIAL_WORDS);
      setWords(batch);
      setLoading(false);
      setTimeout(() => hiddenRef.current?.focus(), 50);
    };
    init();
  }, [INITIAL_WORDS]);

  useEffect(() => {
    if (loading || isFetchingMore) return;
    const currentLine = Math.floor(wordIndex / wordsPerLine) + 1;
    const totalLines = Math.ceil(words.length / wordsPerLine);
    const linesRemaining = totalLines - currentLine;
    if (currentLine >= 2 && linesRemaining <= 2) {
      const more = async () => {
        setIsFetchingMore(true);
        const batch = await fetchMixedBatch(FETCH_MORE_WORDS);
        setWords((w) => [...w, ...batch]);
        setIsFetchingMore(false);
      };
      more();
    }
  }, [wordIndex, words.length, wordsPerLine, loading, isFetchingMore, FETCH_MORE_WORDS]);

  useEffect(() => {
    if (!running) return;
    if (timeLeft <= 0) {
      setRunning(false);
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [running, timeLeft]);

  const handleHiddenChange = (e) => {
    const v = e.target.value.toLowerCase();
    if (!running && v.length > 0) {
      setRunning(true);
      setTimeLeft(totalTime);
    }
    
    // Check for wrong characters WHILE TYPING (before space)
    const expected = (words[wordIndex] || '').toLowerCase();
    let wrongCharsWhileTyping = 0;
    
    for (let i = 0; i < v.length; i++) {
      if (v[i] !== expected[i]) {
        wrongCharsWhileTyping++;
      }
    }
    
    // Also count extra characters beyond expected length
    if (v.length > expected.length) {
      wrongCharsWhileTyping += (v.length - expected.length);
    }
    
    console.log('Typing:', v, 'Expected:', expected, 'Wrong chars:', wrongCharsWhileTyping, 'Consecutive:', consecutiveWrongChars + wrongCharsWhileTyping);
    
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
    
    setCurrentInput(v);

    if (v.endsWith(' ')) {
      const typed = v.trim().toLowerCase();
      const charResults = expected.split('').map((ch, i) => typed[i] === ch);
      for (let i = expected.length; i < typed.length; i++) charResults[i] = false;

      // Count wrong characters in this word
      const wrongCharsInWord = charResults.filter(ok => ok === false).length;
      
      // Check if word is completely correct
      const isWordCorrect = typed === expected;
      
      if (!isWordCorrect) {
        // Increment consecutive wrong words counter
        const newConsecutive = consecutiveWrong + 1;
        setConsecutiveWrong(newConsecutive);
        
        // Add wrong chars to consecutive counter
        const newConsecutiveWrongChars = consecutiveWrongChars + wrongCharsInWord;
        setConsecutiveWrongChars(newConsecutiveWrongChars);
        
        console.log('Wrong word!', {
          typed, 
          expected, 
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
      setCurrentInput('');
    }
  };

  const handleHiddenKeyDown = (e) => {
    if (e.key === 'Backspace' && currentInput === '' && wordIndex > 0) {
      e.preventDefault();
      setWordIndex((i) => i - 1);
      const prev = typedHistory[wordIndex - 1] || '';
      setCurrentInput(prev);
      setResults((r) => {
        const nr = { ...r };
        delete nr[wordIndex - 1];
        return nr;
      });
      setTypedHistory((t) => {
        const nt = { ...t };
        delete nt[wordIndex - 1];
        return nt;
      });
    }
  };

  const clearModal = () => {
    setShowModal(false);
    document.body.classList.remove('modal-open');
  };

  const handleBombClose = () => {
    setShowBomb(false);
    setRunning(true); // Resume timer
    setTimeout(() => hiddenRef.current?.focus(), 100);
  };

  const resetTest = async () => {
    setRunning(false);
    setWordIndex(0);
    setCurrentInput('');
    setResults({});
    setTypedHistory({});
    setTimeLeft(totalTime);
    setSubmittedRun(false);
    setIsFetchingMore(false);
    setConsecutiveWrong(0);
    setConsecutiveWrongChars(0);
    clearModal();

    setLoading(true);
    const batch = await fetchMixedBatch(INITIAL_WORDS);
    setWords(batch);
    setLoading(false);
    setTimeout(() => hiddenRef.current?.focus(), 50);
  };

  const handleRestart = resetTest;
  const handleNext = resetTest;

  const handleTimeSelect = async (secs) => {
    setTotalTime(secs);
    setTimeLeft(secs);
    await resetTest();
  };

  const correctWords = Object.values(results).filter(
    (arr) => Array.isArray(arr) && arr.every((ok) => ok === true)
  ).length;
  const elapsed = totalTime - timeLeft > 0 ? totalTime - timeLeft : running ? 0 : totalTime;
  const minutes = Math.max(elapsed, 1) / 60;
  const wpm = Math.round(correctWords / minutes);
  const accuracy = wordIndex > 0 ? Math.round((correctWords / wordIndex) * 100) : 0;

  const totalChars = Object.values(typedHistory).reduce((sum, w) => sum + w.length, 0);
  const correctChars = Object.values(results).reduce(
    (sum, arr) => sum + (Array.isArray(arr) ? arr.filter((b) => b).length : 0),
    0
  );
  const actualAccuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;

  const visibleCount = wordsPerLine * visibleLines;
  const blockShift = wordsPerLine * 2;
  const blockIndex = Math.floor(wordIndex / blockShift);
  const windowStart = Math.max(0, blockIndex * blockShift);
  const visibleWords = words.slice(windowStart, windowStart + visibleCount);
  const progress = totalTime > 0 ? ((totalTime - Math.max(0, timeLeft)) / totalTime) * 100 : 0;

  useEffect(() => {
    const finished = !running && timeLeft === 0 && !submittedRun;
    if (!finished) return;

    const stats = {
      wpm,
      accuracy,
      actualAccuracy,
      durationSec: totalTime,
      words: Object.keys(typedHistory).length,
      chars: totalChars,
      mode: `time-${totalTime}`,
    };

    const doSubmit = async () => {
      try {
        if (auth.currentUser) {
          await submitScore(stats);
          window.dispatchEvent(new CustomEvent('leaderboard:refresh'));
        }
      } catch (_) {
      } finally {
        setSubmittedRun(true);
        setTimeout(() => {
          setShowModal(true);
          document.body.classList.add('modal-open');
        }, 500);
      }
    };
    doSubmit();
  }, [running, timeLeft, submittedRun, wpm, accuracy, actualAccuracy, totalTime, typedHistory, totalChars]);

  if (loading && words.length === 0) {
    return (
      <div className="typing-wrapper">
        <div className="loading-message">Loading words...</div>
      </div>
    );
  }

  return (
    <div className="typing-wrapper">
      {showBomb && <BombAnimation message={bombMessage} onClose={handleBombClose} />}
      
      <div className="controls-row">
        <div className="left-controls">
          <label className="timer-label">Timer:</label>
          <div className="timer-buttons">
            {[15, 30, 60, 120].map((t) => (
              <button
                key={t}
                className={`timer-btn ${t === totalTime ? 'active' : ''}`}
                onClick={() => handleTimeSelect(t)}
              >
                {t}s
              </button>
            ))}
          </div>
        </div>
        <div className="right-controls">
          <button className="restart-btn" onClick={handleRestart}>Restart</button>
          <div className="time-display">{timeLeft}s</div>
        </div>
      </div>

      <div className="progress-bar" aria-hidden>
        <div className={`progress-fill ${timeLeft <= 5 ? 'warning' : ''}`} style={{ width: `${progress}%` }} />
      </div>

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

      <input
        ref={hiddenRef}
        className="hidden-typing-input"
        aria-label="Type here"
        value={currentInput}
        onChange={handleHiddenChange}
        onKeyDown={handleHiddenKeyDown}
        disabled={timeLeft <= 0 || loading || showBomb}
        autoComplete="off"
        spellCheck="false"
      />

      <ResultsModal
        isOpen={showModal}
        wpm={wpm}
        accuracy={accuracy}
        actualAccuracy={actualAccuracy}
        onRepeat={handleRestart}
        onNext={handleNext}
        onClose={handleNext}
      />
    </div>
  );
}