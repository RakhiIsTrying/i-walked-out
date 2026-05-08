"use client";

import { useState, useEffect, useRef } from "react";
import { getDayNumber, getStats, recordWin, hasPlayedToday, markPlayedToday, GameStats } from "@/lib/games";
import { saveGameResult } from "@/lib/archive";
import { useShareResult } from "@/hooks/useShareResult";
import HexButton from "./HexButton";
import FoundWords from "./FoundWords";

interface SpellingBeeProps {
  puzzle?: {
    center: string;
    outer: string[];
    validWords: string[];
    maxScore: number;
  };
  playDate?: string;
}

interface ParsedPuzzle {
  center: string;
  outer: string[];
  validWords: Set<string>;
  maxScore: number;
  letterSet: Set<string>;
}

function scoreWord(word: string, allLetters: Set<string>): number {
  if (word.length === 4) return 1;
  let score = word.length;
  const uniqueLetters = new Set(word);
  if (allLetters.size === uniqueLetters.size && [...allLetters].every((l) => uniqueLetters.has(l))) {
    score += 7;
  }
  return score;
}

function getRank(score: number, max: number): string {
  const pct = max > 0 ? score / max : 0;
  if (pct >= 0.7) return "Genius";
  if (pct >= 0.5) return "Amazing";
  if (pct >= 0.3) return "Great";
  if (pct >= 0.15) return "Nice";
  if (pct >= 0.05) return "Good";
  return "Beginner";
}

const dictCache = new Map<string, boolean>();

async function checkWord(word: string): Promise<boolean> {
  if (dictCache.has(word)) return dictCache.get(word)!;
  try {
    const res = await fetch(`/api/games/spelling-check?word=${encodeURIComponent(word)}`);
    const data = await res.json();
    dictCache.set(word, data.valid);
    return data.valid;
  } catch {
    return false;
  }
}

function getSaveKey(playDate?: string): string {
  const date = playDate || new Date().toISOString().split("T")[0];
  return `iwo_spelling_${date}`;
}

export default function SpellingBeeGame({ puzzle: puzzleProp, playDate }: SpellingBeeProps) {
  const [puzzle, setPuzzle] = useState<ParsedPuzzle | null>(null);
  const [found, setFound] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<"good" | "bad" | "">("");
  const [stats, setStats] = useState<GameStats | null>(null);
  const [checking, setChecking] = useState(false);
  const submitRef = useRef(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const isToday = !playDate || playDate === new Date().toISOString().split("T")[0];
  const { shareMsg, share } = useShareResult();

  useEffect(() => {
    if (!puzzleProp) return;
    const letterSet = new Set([puzzleProp.center, ...puzzleProp.outer]);
    setPuzzle({
      center: puzzleProp.center,
      outer: puzzleProp.outer,
      validWords: new Set(puzzleProp.validWords),
      maxScore: puzzleProp.maxScore,
      letterSet,
    });

    const saved = localStorage.getItem(getSaveKey(playDate));
    if (saved) {
      try {
        const { f, s } = JSON.parse(saved);
        if (Array.isArray(f)) { setFound(f); setScore(s || 0); }
      } catch {}
    }
    setStats(getStats("spelling"));
  }, []);

  function flash(msg: string, type: "good" | "bad") {
    setMessage(msg);
    setMsgType(type);
    setTimeout(() => { setMessage(""); setMsgType(""); }, 1500);
  }

  function acceptWord(word: string, pz: ParsedPuzzle) {
    const pts = scoreWord(word, pz.letterSet);
    const isPangram = new Set(word).size === pz.letterSet.size && [...pz.letterSet].every((l) => word.includes(l));
    const newFound = [...found, word];
    const newScore = score + pts;
    setFound(newFound);
    setScore(newScore);

    flash(isPangram ? `PANGRAM! +${pts}` : `+${pts}`, "good");
    localStorage.setItem(getSaveKey(playDate), JSON.stringify({ f: newFound, s: newScore }));

    if (getRank(newScore, pz.maxScore) === "Genius" && (!isToday || !hasPlayedToday("spelling"))) {
      if (isToday) markPlayedToday("spelling");
      setStats(recordWin("spelling"));
      saveGameResult("spelling", true, newScore, {
        words: newFound, rank: "Genius", maxScore: pz.maxScore,
      }, playDate);
    }
  }

  async function submit() {
    if (!puzzle || checking || submitRef.current) return;
    const word = current.toLowerCase();
    setCurrent("");

    if (word.length < 4) { flash("Too short", "bad"); return; }
    if (!word.includes(puzzle.center)) { flash("Must use center letter", "bad"); return; }
    for (const ch of word) {
      if (!puzzle.letterSet.has(ch)) { flash("Invalid letter", "bad"); return; }
    }
    if (found.includes(word)) { flash("Already found", "bad"); return; }

    submitRef.current = true;
    setChecking(true);
    const valid = await checkWord(word);
    setChecking(false);
    submitRef.current = false;

    if (valid) {
      acceptWord(word, puzzle);
    } else {
      flash("Not a valid word", "bad");
    }
  }

  function addLetter(l: string) {
    setCurrent((p) => p + l.toUpperCase());
  }

  function shuffle() {
    if (!puzzle) return;
    setPuzzle({ ...puzzle, outer: [...puzzle.outer].sort(() => Math.random() - 0.5) });
  }

  const submitRefFn = useRef(submit);
  submitRefFn.current = submit;

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Enter") { submitRefFn.current(); return; }
      if (e.key === "Backspace") { setCurrent((p) => p.slice(0, -1)); return; }
      const k = e.key.toLowerCase();
      if (/^[a-z]$/.test(k)) setCurrent((p) => p + k.toUpperCase());
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  async function handleShare() {
    if (!puzzle) return;
    await share(
      `Spelling Bee #${getDayNumber()}`,
      `${score} pts · ${found.length} words · ${getRank(score, puzzle.maxScore)}`,
      stats?.currentStreak || 0,
    );
  }

  function focusMobileInput() {
    mobileInputRef.current?.focus();
  }

  if (!puzzle) return null;

  const rank = getRank(score, puzzle.maxScore);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <input
        ref={mobileInputRef}
        type="text" inputMode="none" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}
        aria-label="Type letters"
        style={{ position: "absolute", opacity: 0, height: 1, width: 1, pointerEvents: "none" }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); submitRefFn.current(); }
          if (e.key === "Backspace") { e.preventDefault(); setCurrent((p) => p.slice(0, -1)); }
        }}
        onInput={(e) => {
          const input = e.currentTarget;
          const val = input.value.toLowerCase();
          for (const ch of val) {
            if (/^[a-z]$/.test(ch)) setCurrent((p) => p + ch.toUpperCase());
          }
          input.value = "";
        }}
      />

      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.15em", color: "var(--ink-3)", textTransform: "uppercase" }}>
          {rank} · {score} pts · {found.length} words
        </div>
        <div style={{ height: 6, width: 200, background: "var(--paper-deep)", borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(100, (score / puzzle.maxScore) * 100)}%`, background: "var(--accent)", borderRadius: 3, transition: "width 0.4s" }} />
        </div>
      </div>

      {message && (
        <div className="pop-in" style={{
          fontFamily: "var(--mono)", fontSize: 13, letterSpacing: "0.1em",
          color: msgType === "good" ? "var(--accent)" : "var(--accent-deep)",
          textTransform: "uppercase",
        }}>
          {message}
        </div>
      )}

      <div
        onClick={focusMobileInput}
        style={{
          minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontFamily: "var(--mono)", letterSpacing: "0.1em",
          color: "var(--ink)", minWidth: 160, borderBottom: "2px dashed var(--ink-3)",
          padding: "4px 8px", cursor: "pointer",
        }}
      >
        {checking ? (
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-3)", letterSpacing: "0.1em" }}>checking...</span>
        ) : (
          current || <span style={{ color: "var(--ink-3)", fontSize: 16 }}>tap to type</span>
        )}
      </div>

      <div onClick={focusMobileInput} style={{ position: "relative", width: 200, height: 200, margin: "8px 0" }}>
        <HexButton letter={puzzle.center} isCenter onClick={() => addLetter(puzzle.center)} x={75} y={75} />
        {puzzle.outer.map((l, i) => {
          const angle = (i * 60 - 90) * (Math.PI / 180);
          const x = 75 + Math.cos(angle) * 65;
          const y = 75 + Math.sin(angle) * 65;
          return <HexButton key={`${l}-${i}`} letter={l} isCenter={false} onClick={() => addLetter(l)} x={x} y={y} />;
        })}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setCurrent((p) => p.slice(0, -1))} className="btn-outline" style={{ fontSize: 13, padding: "8px 14px" }}>⌫</button>
        <button onClick={shuffle} className="btn-outline" style={{ fontSize: 13, padding: "8px 14px" }}>↻</button>
        <button onClick={() => submitRefFn.current()} disabled={checking} className="btn-ink" style={{ fontSize: 13, padding: "8px 18px" }}>
          {checking ? "..." : "enter"}
        </button>
      </div>

      <FoundWords words={found} allLetters={puzzle.letterSet} />

      {found.length > 0 && (
        <button onClick={handleShare} className="btn-outline" style={{ fontSize: 12, padding: "6px 14px", marginTop: 4 }}>
          {shareMsg || "share progress"}
        </button>
      )}
    </div>
  );
}
