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

type RefreshWindow = Window & {
  $RefreshReg$?: () => void;
  $RefreshSig$?: () => (type: unknown) => unknown;
  __vite_plugin_react_preamble_installed__?: boolean;
};

const preparedViteOrigins = new Set<string>();

async function prepareViteHmr(entry: string) {
  if (process.env.NODE_ENV !== "development") return;
  const origin = new URL(entry).origin;
  if (preparedViteOrigins.has(origin)) return;

  const refreshRuntime = (await import(/* webpackIgnore: true */ `${origin}/@react-refresh`)) as {
    default: { injectIntoGlobalHook: (target: Window) => void };
  };
  refreshRuntime.default.injectIntoGlobalHook(window);
  const refreshWindow = window as RefreshWindow;
  refreshWindow.$RefreshReg$ = () => undefined;
  refreshWindow.$RefreshSig$ = () => (type) => type;
  refreshWindow.__vite_plugin_react_preamble_installed__ = true;
  await import(/* webpackIgnore: true */ `${origin}/@vite/client`);
  preparedViteOrigins.add(origin);
}

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
    const fallbackUrl = process.env.NODE_ENV === "development" ? "/mfe-config.local.json" : "/mfe-config.json";
    const url = process.env.NEXT_PUBLIC_SHELL_CONFIG_URL ?? fallbackUrl;
    fetchConfig(url)
      .catch(() => url === fallbackUrl ? Promise.reject() : fetchConfig(fallbackUrl))
      .then(setConfig)
      .catch(() => setStatus("Unable to load micro frontend configuration."));
  }, []);

  const loadRemote = useCallback(async (isCancelled: () => boolean) => {
    const host = hostRef.current;
    const remote = config?.remotes[active];
    if (!host || !remote) return;

    setStatus(`Loading ${active} v${remote.version}…`);
    host.replaceChildren();
    let cleanup: void | (() => void);
    try {
      await prepareViteHmr(remote.entry);
      const remoteModule = (await import(/* webpackIgnore: true */ remote.entry)) as RemoteModule;
      if (isCancelled()) return;
      cleanup = remoteModule.mount(host, { apiBaseUrl: remote.apiBaseUrl });
      setStatus("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setStatus(`Unable to load ${active}: ${message}`);
    }
    return () => cleanup?.();
  }, [active, config]);

  useEffect(() => {
    let cancelled = false;
    let dispose: void | (() => void);
    // The state updates happen asynchronously inside the remote loader.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRemote(() => cancelled).then((cleanup) => {
      dispose = cleanup;
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
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

