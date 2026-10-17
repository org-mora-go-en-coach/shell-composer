"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type AppName = "lesson" | "user";
type RemoteModule = {
  mount: (element: HTMLElement, options?: { apiBaseUrl?: string }) => void | (() => void);
};
type RemoteConfig = {
  version: string;
  remotes: Record<AppName, { version: string; entry: string; apiBaseUrl?: string }>;
};

async function fetchConfig(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Config request failed: ${response.status}`);
  return response.json() as Promise<RemoteConfig>;
}

export default function Home() {
  const [active, setActive] = useState<AppName>("lesson");
  const [status, setStatus] = useState("Loading configuration…");
  const [config, setConfig] = useState<RemoteConfig | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SHELL_CONFIG_URL ?? "/mfe-config.json";
    fetchConfig(url)
      .catch(() => fetchConfig("/mfe-config.json"))
      .then(setConfig)
      .catch(() => setStatus("Unable to load micro frontend configuration."));
  }, []);

  const loadRemote = useCallback(async () => {
    const host = hostRef.current;
    const remote = config?.remotes[active];
    if (!host || !remote) return;

    setStatus(`Loading ${active} v${remote.version}…`);
    host.replaceChildren();
    let cleanup: void | (() => void);
    try {
      const remoteModule = (await import(/* webpackIgnore: true */ remote.entry)) as RemoteModule;
      cleanup = remoteModule.mount(host, { apiBaseUrl: remote.apiBaseUrl });
      setStatus("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setStatus(`Unable to load ${active}: ${message}`);
    }
    return () => cleanup?.();
  }, [active, config]);

  useEffect(() => {
    let dispose: void | (() => void);
    // The state updates happen asynchronously inside the remote loader.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRemote().then((cleanup) => {
      dispose = cleanup;
    });
    return () => dispose?.();
  }, [loadRemote]);

  return (
    <div className="shell">
      <header className="header">
        <div>
          <span className="eyebrow">MORA GO</span>
          <h1>English Coach</h1>
        </div>
        <span className="version">shell v{config?.version ?? "1.0.0"}</span>
      </header>
      <aside className="sidebar" aria-label="Micro frontend navigation">
        <p className="navLabel">Workspace</p>
        {(["lesson", "user"] as AppName[]).map((item) => (
          <button key={item} className={active === item ? "active" : ""} onClick={() => setActive(item)}>
            <span>{item === "lesson" ? "◫" : "◎"}</span>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </aside>
      <main className="content">
        {status && <div className="status">{status}</div>}
        <div ref={hostRef} className="remoteHost" />
      </main>
      <footer className="footer">© 2026 Mora Go · Independent micro frontends, one learning experience.</footer>
    </div>
  );
}

