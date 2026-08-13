"use client";

import { useEffect, useState } from "react";

export function useDemoQuery(name: string) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const sync = () => setValue(new URLSearchParams(window.location.search).get(name) ?? "");
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [name]);

  return value;
}
