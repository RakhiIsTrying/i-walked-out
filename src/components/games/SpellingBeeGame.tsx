"use client";

import { useState, useEffect, useRef } from "react";
import { getDayNumber, getStats, recordWin, hasPlayedToday, markPlayedToday, buildShareText, shareOrCopy, GameStats } from "@/lib/games";
import { PANGRAM_SEEDS, DICTIONARY } from "@/lib/words";
import { saveGameResult } from "@/lib/archive";

interface SpellingBeeProps {
  puzzle?: {
    center: string;
    outer: string[];
    validWords: string[];
    maxScore: number;
  };
  playDate?: string;
}

function getFallbackPuzzle() {
  const day = getDayNumber();
  for (let i = 0; i < PANGRAM_SEEDS.length; i++) {
    const seed = PANGRAM_SEEDS[(day + i) % PANGRAM_SEEDS.length];
    const letterSet = new Set(seed.letters);

    const validWords = DICTIONARY.filter((word) => {
      if (word.length < 4) return false;
      if (!word.includes(seed.center)) return false;
      for (const ch of word) {
        if (!letterSet.has(ch)) return false;
      }
      return true;
    });

    if (validWords.length < 12 && i < PANGRAM_SEEDS.length - 1) continue;

    const outer = seed.letters.filter((l) => l !== seed.center);
    const maxScore = validWords.reduce((sum, w) => sum + scoreWord(w, letterSet), 0);
    return { center: seed.center, outer, validWords: new Set(validWords), maxScore, letterSet };
  }
  throw new Error("unreachable");
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
  const [puzzle, setPuzzle] = useState<ReturnType<typeof getFallbackPuzzle> | null>(null);
  const [found, setFound] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<"good" | "bad" | "">("");
  const [stats, setStats] = useState<GameStats | null>(null);
  const [shareMsg, setShareMsg] = useState("");
  const [checking, setChecking] = useState(false);
  const submitRef = useRef(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const isToday = !playDate || playDate === new Date().toISOString().split("T")[0];

  useEffect(() => {
    let p: ReturnType<typeof getFallbackPuzzle>;
    if (puzzleProp) {
      const letterSet = new Set([puzzleProp.center, ...puzzleProp.outer]);
      p = {
        center: puzzleProp.center,
        outer: puzzleProp.outer,
        validWords: new Set(puzzleProp.validWords),
        maxScore: puzzleProp.maxScore,
        letterSet,
      };
    } else {
      p = getFallbackPuzzle();
    }
    setPuzzle(p);

    const saved = localStorage.getItem(getSaveKey(playDate));
    if (saved) {
      try {
        const { f, s } = JSON.parse(saved);
        if (Array.isArray(f)) {
          setFound(f);
          setScore(s || 0);
        }
      } catch {}
    }
    setStats(getStats("spelling"));
  }, []);

  function flash(msg: string, type: "good" | "bad") {
    setMessage(msg);
    setMsgType(type);
    setTimeout(() => { setMessage(""); setMsgType(""); }, 1500);
  }

  function acceptWord(word: string, pz: NonNullable<typeof puzzle>) {
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
        words: newFound,
        rank: "Genius",
        maxScore: pz.maxScore,
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

    if (puzzle.validWords.has(word)) {
      acceptWord(word, puzzle);
      return;
    }

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
    const shuffled = [...puzzle.outer].sort(() => Math.random() - 0.5);
    setPuzzle({ ...puzzle, outer: shuffled });
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
    const text = buildShareText(
      `Spelling Bee #${getDayNumber()}`,
      `${score} pts · ${found.length} words · ${getRank(score, puzzle.maxScore)}`,
      stats?.currentStreak || 0
    );
    const r = await shareOrCopy(text);
    setShareMsg(r === "copied" ? "Copied!" : r === "shared" ? "Shared!" : "");
    if (r !== "failed") setTimeout(() => setShareMsg(""), 2000);
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
        type="text"
        inputMode="none"
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
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

      {/* Score / Rank */}
      <div style={{ textAlign: "center" }}>
        <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--ink-faded)", textTransform: "uppercase" }}>
          {rank} · {score} pts · {found.length} words
        </div>
        <div style={{ height: 6, width: 200, background: "var(--paper-deep)", borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(100, (score / puzzle.maxScore) * 100)}%`, background: "var(--teal)", borderRadius: 3, transition: "width 0.4s" }} />
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className="typewriter pop-in"
          style={{
            fontSize: 13, letterSpacing: "0.1em",
            color: msgType === "good" ? "var(--teal)" : "var(--rose)",
            textTransform: "uppercase",
          }}
        >
          {message}
        </div>
      )}

      {/* Current word */}
      <div
        onClick={focusMobileInput}
        style={{
          minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontFamily: "'Bungee', system-ui", letterSpacing: "0.1em",
          color: "var(--ink)", minWidth: 160, borderBottom: "2px dashed var(--ink-faded)",
          padding: "4px 8px", cursor: "pointer",
        }}
      >
        {checking ? (
          <span className="typewriter" style={{ fontSize: 12, color: "var(--ink-faded)", letterSpacing: "0.1em" }}>checking...</span>
        ) : (
          current || <span style={{ color: "var(--ink-faded)", fontSize: 16 }}>tap to type</span>
        )}
      </div>

      {/* Hexagon layout */}
      <div onClick={focusMobileInput} style={{ position: "relative", width: 200, height: 200, margin: "8px 0" }}>
        <HexButton letter={puzzle.center} isCenter onClick={() => addLetter(puzzle.center)} x={75} y={75} />
        {puzzle.outer.map((l, i) => {
          const angle = (i * 60 - 90) * (Math.PI / 180);
          const x = 75 + Math.cos(angle) * 65;
          const y = 75 + Math.sin(angle) * 65;
          return <HexButton key={`${l}-${i}`} letter={l} isCenter={false} onClick={() => addLetter(l)} x={x} y={y} />;
        })}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setCurrent((p) => p.slice(0, -1))} className="btn-ghost" style={{ fontSize: 13, padding: "8px 14px" }}>
          ⌫
        </button>
        <button onClick={shuffle} className="btn-ghost" style={{ fontSize: 13, padding: "8px 14px" }}>
          ↻
        </button>
        <button onClick={() => submitRefFn.current()} disabled={checking} className="btn-paper" style={{ fontSize: 13, padding: "8px 18px" }}>
          {checking ? "..." : "enter"}
        </button>
      </div>

      {/* Found words */}
      {found.length > 0 && (
        <div style={{
          maxWidth: 360, width: "100%",
          borderTop: "1.5px dashed var(--ink-faded)", paddingTop: 12, marginTop: 4,
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {found.map((w) => {
              const isPangram = new Set(w).size === puzzle.letterSet.size;
              return (
                <span
                  key={w}
                  className="typewriter"
                  style={{
                    fontSize: 12, padding: "4px 10px",
                    background: isPangram ? "var(--butter)" : "var(--paper-deep)",
                    border: isPangram ? "2px solid var(--ink)" : "1px solid var(--ink-faded)",
                    borderRadius: 2, fontWeight: isPangram ? 700 : 400,
                    letterSpacing: "0.08em",
                  }}
                >
                  {w.toUpperCase()}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Share */}
      {found.length > 0 && (
        <button onClick={handleShare} className="btn-ghost" style={{ fontSize: 12, padding: "6px 14px", marginTop: 4 }}>
          {shareMsg || "share progress"}
        </button>
      )}
    </div>
  );
}

function HexButton({ letter, isCenter, onClick, x, y }: { letter: string; isCenter: boolean; onClick: () => void; x: number; y: number }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute",
        left: x, top: y,
        width: 50, height: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, fontWeight: 700,
        fontFamily: "'Bungee', system-ui",
        color: isCenter ? "#fff" : "var(--ink)",
        background: isCenter ? "var(--rose)" : "var(--paper-deep)",
        border: `3px solid ${isCenter ? "var(--rose)" : "var(--ink)"}`,
        borderRadius: "50%",
        cursor: "pointer",
        transition: "transform 0.15s",
        textTransform: "uppercase",
        zIndex: isCenter ? 2 : 1,
      }}
      onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = "scale(1.1)"; }}
      onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = "scale(1)"; }}
    >
      {letter.toUpperCase()}
    </button>
  );
}
