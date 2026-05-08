"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getDayNumber, getStats, recordWin, recordLoss, GameStats } from "@/lib/games";
import { WORDLE_ANSWERS } from "@/lib/words";
import { saveGameResult } from "@/lib/archive";
import { useShareResult } from "@/hooks/useShareResult";
import WordleKeyboard from "./WordleKeyboard";
import WordleGrid, { CellState } from "./WordleGrid";

const ROWS = 6;
const COLS = 5;

interface WordleProps {
  answer?: string;
  playDate?: string;
}

const DAILY_PLAY_LIMIT = 1;

function getPlayedWords(): string[] {
  const today = new Date().toISOString().split("T")[0];
  try {
    const stored = localStorage.getItem("iwo_wordle_played_words");
    if (stored) {
      const { date, words } = JSON.parse(stored);
      if (date === today) return words;
    }
  } catch {}
  return [];
}

function addPlayedWord(word: string) {
  const today = new Date().toISOString().split("T")[0];
  const words = getPlayedWords();
  if (!words.includes(word.toUpperCase())) words.push(word.toUpperCase());
  localStorage.setItem("iwo_wordle_played_words", JSON.stringify({ date: today, words }));
}

function pickNewWord(): string {
  const played = new Set(getPlayedWords());
  const available = WORDLE_ANSWERS.filter(w => !played.has(w.toUpperCase()));
  if (available.length === 0) return WORDLE_ANSWERS[Math.floor(Math.random() * WORDLE_ANSWERS.length)].toUpperCase();
  return available[Math.floor(Math.random() * available.length)].toUpperCase();
}

function getRandomPlayCount(): number {
  const today = new Date().toISOString().split("T")[0];
  try {
    const stored = localStorage.getItem("iwo_wordle_plays");
    if (stored) {
      const { date, count } = JSON.parse(stored);
      if (date === today) return count;
    }
  } catch {}
  return 0;
}

function incrementRandomPlayCount(): number {
  const today = new Date().toISOString().split("T")[0];
  const count = getRandomPlayCount() + 1;
  localStorage.setItem("iwo_wordle_plays", JSON.stringify({ date: today, count }));
  return count;
}

function getFallbackWord(): string {
  const day = getDayNumber();
  return WORDLE_ANSWERS[day % WORDLE_ANSWERS.length].toUpperCase();
}

function evalGuess(guess: string, answer: string): CellState[] {
  const result: CellState[] = Array(COLS).fill("absent");
  const ansLetters = answer.split("");

  for (let i = 0; i < COLS; i++) {
    if (guess[i] === answer[i]) {
      result[i] = "correct";
      ansLetters[i] = "";
    }
  }
  for (let i = 0; i < COLS; i++) {
    if (result[i] === "correct") continue;
    const idx = ansLetters.indexOf(guess[i]);
    if (idx !== -1) {
      result[i] = "present";
      ansLetters[idx] = "";
    }
  }
  return result;
}

const wordCache = new Map<string, boolean>();

async function checkWord(word: string): Promise<boolean> {
  const lower = word.toLowerCase();
  if (wordCache.has(lower)) return wordCache.get(lower)!;
  try {
    const res = await fetch(`/api/games/spelling-check?word=${encodeURIComponent(lower)}`);
    const data = await res.json();
    wordCache.set(lower, data.valid);
    return data.valid;
  } catch {
    return true;
  }
}

export default function WordleGame({ answer: answerProp, playDate }: WordleProps) {
  const [answer, setAnswer] = useState(() => answerProp?.toUpperCase() || getFallbackWord());
  const [guesses, setGuesses] = useState<string[]>([]);
  const [states, setStates] = useState<CellState[][]>([]);
  const [current, setCurrentState] = useState("");
  const currentRef = useRef("");
  const setCurrent = (val: string | ((p: string) => string)) => {
    setCurrentState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      currentRef.current = next;
      return next;
    });
  };
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [checking, setChecking] = useState(false);
  const checkingRef = useRef(false);
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState<GameStats | null>(null);
  const [roundNum, setRoundNum] = useState(1);
  const [playCount, setPlayCount] = useState(0);

  const { shareMsg, share } = useShareResult();

  useEffect(() => {
    setStats(getStats("wordle"));
    setPlayCount(getRandomPlayCount());
    if (!answerProp) {
      const played = getPlayedWords();
      if (played.includes(answer)) {
        setAnswer(pickNewWord());
      }
    }
  }, []);

  const keyColors = useCallback(() => {
    const map: Record<string, CellState> = {};
    guesses.forEach((g, gi) => {
      g.split("").forEach((ch, ci) => {
        const s = states[gi]?.[ci];
        if (!s) return;
        const prev = map[ch];
        if (s === "correct") map[ch] = "correct";
        else if (s === "present" && prev !== "correct") map[ch] = "present";
        else if (!prev) map[ch] = "absent";
      });
    });
    return map;
  }, [guesses, states]);

  async function submit() {
    const word = currentRef.current;
    if (word.length !== COLS || checkingRef.current) return;

    checkingRef.current = true;
    setChecking(true);
    const valid = await checkWord(word);
    checkingRef.current = false;
    setChecking(false);

    if (!valid) {
      setShake(true);
      setMessage("Not in word list");
      setTimeout(() => { setShake(false); setMessage(""); }, 1200);
      return;
    }

    const st = evalGuess(word, answer);
    const newGuesses = [...guesses, word];
    const newStates = [...states, st];
    setGuesses(newGuesses);
    setStates(newStates);
    setCurrent("");

    const isWin = st.every((s) => s === "correct");
    const isLoss = !isWin && newGuesses.length >= ROWS;

    if (isWin || isLoss) {
      setGameOver(true);
      setWon(isWin);
      addPlayedWord(answer);
      const newStats = isWin ? recordWin("wordle") : recordLoss("wordle");
      setStats(newStats);
      incrementRandomPlayCount();
      setPlayCount(getRandomPlayCount());
      saveGameResult("wordle", isWin, isWin ? newGuesses.length : 0, {
        answer, guesses: newGuesses, attempts: newGuesses.length,
      }, playDate);
    }
  }

  function onKey(key: string) {
    if (gameOver || checkingRef.current) return;
    if (key === "ENTER") { submit(); return; }
    if (key === "⌫" || key === "BACKSPACE") { setCurrent((p) => p.slice(0, -1)); return; }
    if (/^[A-Z]$/.test(key) && current.length < COLS) setCurrent((p) => p + key);
  }

  const onKeyRef = useRef(onKey);
  onKeyRef.current = onKey;

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const k = e.key.toUpperCase();
      if (k === "ENTER" || k === "BACKSPACE" || (/^[A-Z]$/.test(k) && k.length === 1)) {
        onKeyRef.current(k);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function buildEmoji(): string {
    return states.map((row) =>
      row.map((s) => (s === "correct" ? "🟩" : s === "present" ? "🟨" : "⬛")).join("")
    ).join("\n");
  }

  async function handleShare() {
    const emoji = buildEmoji();
    await share(
      `Wordle #${getDayNumber()}`,
      `${won ? guesses.length : "X"}/${ROWS}\n${emoji}`,
      stats?.currentStreak || 0,
    );
  }

  const kc = keyColors();
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  function focusMobileInput() {
    mobileInputRef.current?.focus();
  }

  if (playCount >= DAILY_PLAY_LIMIT && guesses.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "60px 20px", textAlign: "center" }}>
        <p className="serif" style={{ fontSize: 28, fontStyle: "italic", color: "var(--ink)", margin: 0 }}>
          You've played today's word.
        </p>
        <p className="typewriter" style={{ fontSize: 12, color: "var(--ink-faded)", letterSpacing: "0.12em" }}>
          Come back tomorrow for a new word.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, maxWidth: "100%", overflow: "hidden" }}>
      <input
        ref={mobileInputRef}
        type="text"
        inputMode="none"
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Type your guess"
        style={{ position: "absolute", opacity: 0, height: 1, width: 1, pointerEvents: "none" }}
        onKeyDown={(e) => {
          e.preventDefault();
          const k = e.key.toUpperCase();
          if (k === "ENTER" || k === "BACKSPACE" || (/^[A-Z]$/.test(k) && k.length === 1)) {
            onKeyRef.current(k);
          }
        }}
        onInput={(e) => {
          const input = e.currentTarget;
          const val = input.value.toUpperCase();
          for (const ch of val) {
            if (/^[A-Z]$/.test(ch)) onKeyRef.current(ch);
          }
          input.value = "";
        }}
      />
      <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--ink-faded)" }}>
        one word per day
      </div>

      {(message || checking) && (
        <div className="typewriter" style={{ fontSize: 13, letterSpacing: "0.1em", color: checking ? "var(--ink-faded)" : "var(--rose)", textTransform: "uppercase" }}>
          {checking ? "checking..." : message}
        </div>
      )}

      <WordleGrid
        guesses={guesses}
        states={states}
        current={current}
        shake={shake}
        gameOver={gameOver}
        isMobile={isMobile}
        rows={ROWS}
        cols={COLS}
        onClick={focusMobileInput}
        roundNum={roundNum}
      />

      <WordleKeyboard keyColors={kc} isMobile={isMobile} onKey={onKey} />

      {gameOver && (
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <p className="serif" style={{ fontSize: 22, fontStyle: "italic", color: won ? "var(--teal)" : "var(--rose)" }}>
            {won ? `Got it in ${guesses.length}!` : `The word was ${answer}`}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
            <button onClick={handleShare} className="btn-paper" style={{ fontSize: 13 }}>
              {shareMsg || "share result"}
            </button>
            <span className="typewriter" style={{ fontSize: 11, color: "var(--ink-faded)", letterSpacing: "0.1em", padding: "8px 0" }}>
              come back tomorrow
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
