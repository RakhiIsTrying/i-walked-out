import { useState, useCallback } from "react";
import { buildShareText, shareOrCopy } from "@/lib/games";

export function useShareResult() {
  const [shareMsg, setShareMsg] = useState("");

  const share = useCallback(async (title: string, body: string, streak: number) => {
    const text = buildShareText(title, body, streak);
    const r = await shareOrCopy(text);
    setShareMsg(r === "copied" ? "Copied!" : r === "shared" ? "Shared!" : "");
    if (r !== "failed") setTimeout(() => setShareMsg(""), 2000);
  }, []);

  return { shareMsg, share };
}
