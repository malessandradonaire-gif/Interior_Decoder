"use client";

import { useEffect, useState } from "react";

interface LoaderState<T> {
  data?: T;
  error?: unknown;
  loading: boolean;
}

/** Runs an async loader when deps change; `reload()` re-runs it. */
export function useLoader<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<LoaderState<T>>({ loading: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    load().then(
      (data) => !cancelled && setState({ data, loading: false }),
      (error) => !cancelled && setState({ error, loading: false }),
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  return { ...state, reload: () => setVersion((v) => v + 1) };
}
