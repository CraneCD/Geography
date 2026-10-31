import { useSyncExternalStore, useCallback } from "react";

// Routes:  #/  ·  #/<subject>  ·  #/<subject>/<mode>
function parse(hash) {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  return { subject: parts[0] ?? null, mode: parts[1] ?? null, extra: parts.length > 2 };
}

const subscribe = (cb) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const getHash = () => window.location.hash;

export function useHashRoute() {
  const hash = useSyncExternalStore(subscribe, getHash, () => "");
  const navigate = useCallback((subject, mode) => {
    const path = ["", subject, mode].filter((p) => p != null).map(encodeURIComponent).join("/");
    window.location.hash = path || "/";
  }, []);
  return [parse(hash), navigate];
}
