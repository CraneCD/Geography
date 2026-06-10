import { useState, useEffect } from "react";

const WIKI_API = "https://en.wikipedia.org/api/rest_v1/page/summary/";

// Module-level cache so repeated questions don't re-fetch
const imgCache = new Map();

async function fetchWikiImage(wikiTitle) {
  if (imgCache.has(wikiTitle)) return imgCache.get(wikiTitle);
  const res = await fetch(WIKI_API + encodeURIComponent(wikiTitle));
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  // Prefer originalimage (full size) over thumbnail (often too small)
  const url = data?.originalimage?.source ?? data?.thumbnail?.source ?? null;
  imgCache.set(wikiTitle, url);
  return url;
}

// Resolve a Wikipedia article title to its lead image URL.
// Returns { src, status } where status is "loading" | "loaded" | "failed".
export function useWikiImage(wikiTitle) {
  const [src, setSrc] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!wikiTitle) { setStatus("failed"); return; }
    let cancelled = false;
    setSrc(null);
    setStatus("loading");
    fetchWikiImage(wikiTitle)
      .then((url) => {
        if (cancelled) return;
        if (url) { setSrc(url); setStatus("loaded"); }
        else setStatus("failed");
      })
      .catch(() => { if (!cancelled) setStatus("failed"); });
    return () => { cancelled = true; };
  }, [wikiTitle]);

  return { src, status };
}
