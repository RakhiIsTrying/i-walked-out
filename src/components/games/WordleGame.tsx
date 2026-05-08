"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getDayNumber, getStats, recordWin, recordLoss, buildShareText, shareOrCopy, GameStats } from "@/lib/games";
import { WORDLE_ANSWERS } from "@/lib/words";
import { saveGameResult } from "@/lib/archive";

type CellState = "correct" | "present" | "absent" | "empty";

const ROWS = 6;
const COLS = 5;

interface WordleProps {
  answer?: string;
  playDate?: string;
}

const DAILY_PLAY_LIMIT = 5;

function getRandomWord(): string {
  return WORDLE_ANSWERS[Math.floor(Math.random() * WORDLE_ANSWERS.length)].toUpperCase();
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

const KEYBOARD_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","⌫"],
];

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
  const [shareMsg, setShareMsg] = useState("");
  const [roundNum, setRoundNum] = useState(1);
  const [playCount, setPlayCount] = useState(0);

  useEffect(() => {
    setStats(getStats("wordle"));
    setPlayCount(getRandomPlayCount());
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
      const newStats = isWin ? recordWin("wordle") : recordLoss("wordle");
      setStats(newStats);
      const newCount = incrementRandomPlayCount();
      setPlayCount(newCount);
      saveGameResult("wordle", isWin, isWin ? newGuesses.length : 0, {
        answer,
        guesses: newGuesses,
        attempts: newGuesses.length,
      }, playDate);
    }
  }

  const canPlayAgain = playCount < DAILY_PLAY_LIMIT;
  const limitReached = playCount >= DAILY_PLAY_LIMIT && gameOver;

  function playAgain() {
    if (!canPlayAgain) return;
    setAnswer(getRandomWord());
    setGuesses([]);
    setStates([]);
    setCurrent("");
    setGameOver(false);
    setWon(false);
    setMessage("");
    setShareMsg("");
    setRoundNum((n) => n + 1);
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
    const text = buildShareText(
      `Wordle #${getDayNumber()}`,
      `${won ? guesses.length : "X"}/${ROWS}\n${emoji}`,
      stats?.currentStreak || 0
    );
    const r = await shareOrCopy(text);
    setShareMsg(r === "copied" ? "Copied!" : r === "shared" ? "Shared!" : "");
    if (r !== "failed") setTimeout(() => setShareMsg(""), 2000);
  }

  const cellBg = (s: CellState) =>
    s === "correct" ? "var(--teal)" : s === "present" ? "var(--butter)" : s === "absent" ? "var(--ink-faded)" : "transparent";

  const cellColor = (s: CellState) => (s === "empty" ? "var(--ink)" : "#fff");

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
          You've played all {DAILY_PLAY_LIMIT} rounds today.
        </p>
        <p className="typewriter" style={{ fontSize: 12, color: "var(--ink-faded)", letterSpacing: "0.12em" }}>
          Come back tomorrow for new words.
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
        {DAILY_PLAY_LIMIT - playCount} of {DAILY_PLAY_LIMIT} rounds left today
      </div>

      {(message || checking) && (
        <div className="typewriter" style={{ fontSize: 13, letterSpacing: "0.1em", color: checking ? "var(--ink-faded)" : "var(--rose)", textTransform: "uppercase" }}>
          {checking ? "checking..." : message}
        </div>
      )}

      {/* Grid */}
      <div key={roundNum} onClick={focusMobileInput} style={{ display: "flex", flexDirection: "column", gap: isMobile ? 4 : 6, cursor: "pointer", maxWidth: "100%" }}>
        {Array.from({ length: ROWS }).map((_, ri) => {
          const g = guesses[ri];
          const s = states[ri];
          const isCurrent = ri === guesses.length && !gameOver;
          const cellPx = isMobile ? 44 : 52;
          return (
            <div
              key={ri}
              style={{ display: "flex", gap: isMobile ? 4 : 6, justifyContent: "center", animation: isCurrent && shake ? "wiggle 0.3s" : undefined }}
            >
              {Array.from({ length: COLS }).map((_, ci) => {
                const letter = g ? g[ci] : isCurrent ? current[ci] || "" : "";
                const state: CellState = s ? s[ci] : "empty";
                return (
                  <div
                    key={ci}
                    className="pop-in"
                    style={{
                      width: cellPx, height: cellPx,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: cellBg(state),
                      border: state === "empty" ? "2px solid var(--ink-faded)" : "2px solid transparent",
                      fontSize: isMobile ? 20 : 24, fontWeight: 700,
                      fontFamily: "'Bungee', system-ui",
                      color: cellColor(state),
                      transition: "all 0.3s",
                      animationDelay: s ? `${ci * 0.1}s` : "0s",
                    }}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Keyboard */}
      <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 4 : 6, marginTop: 8, width: "100%", maxWidth: 484 }}>
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} style={{ display: "flex", gap: isMobile ? 3 : 4, justifyContent: "center", width: "100%" }}>
            {row.map((key) => {
              const state = kc[key];
              const isWide = key === "ENTER" || key === "⌫";
              return (
                <button
                  key={key}
                  onClick={() => onKey(key)}
                  className="typewriter"
                  style={{
                    flex: isWide ? 1.5 : 1,
                    minWidth: 0,
                    height: isMobile ? 40 : 44,
                    padding: "0 2px",
                    fontSize: isWide ? (isMobile ? 10 : 11) : (isMobile ? 13 : 14),
                    fontWeight: 700,
                    background: state === "correct" ? "var(--teal)" : state === "present" ? "var(--butter)" : state === "absent" ? "var(--ink-faded)" : "var(--paper-deep)",
                    color: state && state !== "empty" ? "#fff" : "var(--ink)",
                    border: isMobile ? "1.5px solid var(--ink)" : "2px solid var(--ink)",
                    cursor: "pointer",
                    borderRadius: 3,
                    transition: "all 0.2s",
                    letterSpacing: "0.02em",
                  }}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* End state */}
      {gameOver && (
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <p className="serif" style={{ fontSize: 22, fontStyle: "italic", color: won ? "var(--teal)" : "var(--rose)" }}>
            {won ? `Got it in ${guesses.length}!` : `The word was ${answer}`}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
            <button onClick={handleShare} className="btn-paper" style={{ fontSize: 13 }}>
              {shareMsg || "share result"}
            </button>
            {canPlayAgain ? (
              <button onClick={playAgain} className="btn-ghost" style={{ fontSize: 13 }}>
                play again ({DAILY_PLAY_LIMIT - playCount} left)
              </button>
            ) : (
              <span className="typewriter" style={{ fontSize: 11, color: "var(--ink-faded)", letterSpacing: "0.1em", padding: "8px 0" }}>
                all {DAILY_PLAY_LIMIT} rounds used today
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
