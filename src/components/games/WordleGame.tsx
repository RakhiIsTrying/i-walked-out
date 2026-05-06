"use client";

import { useState, useEffect, useCallback } from "react";
import { getDayNumber, getStats, recordWin, recordLoss, buildShareText, shareOrCopy, GameStats } from "@/lib/games";
import { WORDLE_ANSWERS } from "@/lib/words";
import { RefreshCw } from "lucide-react";
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

async function checkWordValid(word: string): Promise<boolean> {
  const lower = word.toLowerCase();
  if (WORDLE_ANSWERS.includes(lower)) return true;
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
  const [current, setCurrent] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);
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
    if (current.length !== COLS || checking) return;

    setChecking(true);
    const valid = await checkWordValid(current);
    setChecking(false);

    if (!valid) {
      setShake(true);
      setMessage("Not in word list");
      setTimeout(() => { setShake(false); setMessage(""); }, 1200);
      return;
    }

    const st = evalGuess(current, answer);
    const newGuesses = [...guesses, current];
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
      saveGameResult("wordle", isWin, isWin ? newGuesses.length : 0, {
        answer,
        guesses: newGuesses,
        attempts: newGuesses.length,
      }, playDate);
    }
  }

  const canPlayAgain = playCount < DAILY_PLAY_LIMIT;

  function playAgain() {
    if (!canPlayAgain) return;
    const newCount = incrementRandomPlayCount();
    setPlayCount(newCount);
    setAnswer(getRandomWord());
    setGuesses([]);
    setStates([]);
    setCurrent("");
    setGameOver(false);
    setWon(false);
    setMessage("");
    setChecking(false);
    setShareMsg("");
    setRoundNum((n) => n + 1);
  }

  function onKey(key: string) {
    if (gameOver) return;
    if (key === "ENTER") { submit(); return; }
    if (key === "⌫" || key === "BACKSPACE") { setCurrent((p) => p.slice(0, -1)); return; }
    if (/^[A-Z]$/.test(key) && current.length < COLS) setCurrent((p) => p + key);
  }

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const k = e.key.toUpperCase();
      if (k === "ENTER" || k === "BACKSPACE" || (/^[A-Z]$/.test(k) && k.length === 1)) {
        onKey(k);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

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

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <button
        onClick={playAgain}
        disabled={!canPlayAgain}
        title={canPlayAgain ? "New word" : "Daily limit reached"}
        className="btn-ghost"
        style={{ fontSize: 12, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6, opacity: canPlayAgain ? 1 : 0.4 }}
      >
        <RefreshCw size={14} /> {canPlayAgain ? `new word (${DAILY_PLAY_LIMIT - playCount} left)` : "limit reached"}
      </button>

      {message && (
        <div className="typewriter" style={{ fontSize: 13, letterSpacing: "0.1em", color: "var(--rose)", textTransform: "uppercase" }}>
          {message}
        </div>
      )}

      {/* Grid */}
      <div key={roundNum} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {Array.from({ length: ROWS }).map((_, ri) => {
          const g = guesses[ri];
          const s = states[ri];
          const isCurrent = ri === guesses.length && !gameOver;
          return (
            <div
              key={ri}
              style={{ display: "flex", gap: 6, animation: isCurrent && shake ? "wiggle 0.3s" : undefined }}
            >
              {Array.from({ length: COLS }).map((_, ci) => {
                const letter = g ? g[ci] : isCurrent ? current[ci] || "" : "";
                const state: CellState = s ? s[ci] : "empty";
                return (
                  <div
                    key={ci}
                    className="pop-in"
                    style={{
                      width: 52, height: 52,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: cellBg(state),
                      border: state === "empty" ? "2px solid var(--ink-faded)" : "2px solid transparent",
                      fontSize: 24, fontWeight: 700,
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
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} style={{ display: "flex", gap: 4, justifyContent: "center" }}>
            {row.map((key) => {
              const state = kc[key];
              const isWide = key === "ENTER" || key === "⌫";
              return (
                <button
                  key={key}
                  onClick={() => onKey(key)}
                  className="typewriter"
                  style={{
                    minWidth: isWide ? 56 : 34, height: 44,
                    padding: "0 6px",
                    fontSize: isWide ? 11 : 14,
                    fontWeight: 700,
                    background: state === "correct" ? "var(--teal)" : state === "present" ? "var(--butter)" : state === "absent" ? "var(--ink-faded)" : "var(--paper-deep)",
                    color: state && state !== "empty" ? "#fff" : "var(--ink)",
                    border: "2px solid var(--ink)",
                    cursor: "pointer",
                    borderRadius: 2,
                    transition: "all 0.2s",
                    letterSpacing: "0.05em",
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
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8 }}>
            <button onClick={handleShare} className="btn-paper" style={{ fontSize: 13 }}>
              {shareMsg || "share result"}
            </button>
            {canPlayAgain && (
              <button onClick={playAgain} className="btn-ghost" style={{ fontSize: 13 }}>
                play again ({DAILY_PLAY_LIMIT - playCount} left)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
