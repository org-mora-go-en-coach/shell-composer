"use client";

import { useEffect, useRef } from "react";

type AppName = "lesson" | "user";
type Remote = {
  version: string;
  entry: string;
  apiBaseUrl?: string;
  lessonApiBaseUrl?: string;
};
type Config = {
  version: string;
  remotes: { layout: Remote; lesson: Remote; user: Remote };
};
type LayoutController = {
  contentElement: HTMLDivElement;
  setActive: (app: AppName) => void;
  setStatus: (status: string) => void;
  unmount: () => void;
};
type RefreshWindow = Window & {
  $RefreshReg$?: () => void;
  $RefreshSig$?: () => (type: unknown) => unknown;
  __vite_plugin_react_preamble_installed__?: boolean;
};

const preparedViteOrigins = new Set<string>();
const loadedStylesheets = new Map<string, Promise<void>>();

async function prepareViteHmr(entry: string) {
  if (process.env.NODE_ENV !== "development") return;
  const origin = new URL(entry).origin;
  if (preparedViteOrigins.has(origin)) return;
  const runtime = (await import(
    /* webpackIgnore: true */ `${origin}/@react-refresh`
  )) as { default: { injectIntoGlobalHook: (target: Window) => void } };
  runtime.default.injectIntoGlobalHook(window);
  const target = window as RefreshWindow;
  target.$RefreshReg$ = () => undefined;
  target.$RefreshSig$ = () => (type) => type;
  target.__vite_plugin_react_preamble_installed__ = true;
  await import(/* webpackIgnore: true */ `${origin}/@vite/client`);
  preparedViteOrigins.add(origin);
}

function loadRemoteStylesheet(name: "layout" | AppName, entry: string) {
  if (process.env.NODE_ENV === "development") return Promise.resolve();

  const entryUrl = new URL(entry);
  const stylesheetUrl = new URL(`./assets/mfe-${name}.css`, entryUrl);
  stylesheetUrl.search = entryUrl.search;
  const href = stylesheetUrl.href;
  const pending = loadedStylesheets.get(href);
  if (pending) return pending;

  const promise = new Promise<void>((resolve, reject) => {
    const id = `mfe-${name}-styles`;
    const existing = document.getElementById(id) as HTMLLinkElement | null;
    const link = existing ?? document.createElement("link");

    if (link.sheet) {
      resolve();
      return;
    }

    link.addEventListener("load", () => resolve(), { once: true });
    link.addEventListener(
      "error",
      () => reject(new Error(`${name} 스타일을 불러올 수 없습니다.`)),
      { once: true },
    );

    if (!existing) {
      link.id = id;
      link.rel = "stylesheet";
      link.href = href;
      document.head.append(link);
    }
  });

  loadedStylesheets.set(href, promise);
  return promise;
}

async function fetchConfig(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok)
    throw new Error(`설정 요청에 실패했습니다: ${response.status}`);
  return response.json() as Promise<Config>;
}

export default function Home() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let layout: LayoutController | undefined;
    let disposeFeature: (() => void) | undefined;
    const fallback =
      process.env.NODE_ENV === "development"
        ? "/mfe-config.local.json"
        : "/mfe-config.json";
    const productionConfig = "https://shell-config.vercel.app/config.json";
    const source =
      process.env.NODE_ENV === "development" ? fallback : productionConfig;

    async function start() {
      const config = await fetchConfig(source).catch(() =>
        source === fallback ? Promise.reject() : fetchConfig(fallback),
      );
      if (
        process.env.NODE_ENV === "development" &&
        process.env.NEXT_PUBLIC_API_LESSON_URL
      ) {
        config.remotes.lesson.apiBaseUrl =
          process.env.NEXT_PUBLIC_API_LESSON_URL;
        config.remotes.user.lessonApiBaseUrl = `${process.env.NEXT_PUBLIC_API_LESSON_URL}/api/v1.0.2`;
      }
      if (cancelled || !rootRef.current) return;

      const layoutRemote = config.remotes.layout;
      await Promise.all([
        prepareViteHmr(layoutRemote.entry),
        loadRemoteStylesheet("layout", layoutRemote.entry),
      ]);
      const layoutModule = (await import(
        /* webpackIgnore: true */ layoutRemote.entry
      )) as {
        mount: (
          element: HTMLElement,
          options: { version: string; onNavigate: (app: AppName) => void },
        ) => LayoutController;
      };
      if (cancelled) return;

      const load = async (app: AppName) => {
        layout?.setStatus(
          `${app === "lesson" ? "강의" : "사용자 정보"} 불러오는 중…`,
        );
        const remote = config.remotes[app];
        await Promise.all([
          prepareViteHmr(remote.entry),
          loadRemoteStylesheet(app, remote.entry),
        ]);
        const remoteModule = (await import(
          /* webpackIgnore: true */ remote.entry
        )) as {
          mount: (
            element: HTMLElement,
            options: { apiBaseUrl?: string; lessonApiBaseUrl?: string },
          ) => () => void;
        };
        if (cancelled) return;

        disposeFeature?.();
        layout?.setActive(app);
        disposeFeature = remoteModule.mount(layout!.contentElement, {
          apiBaseUrl: remote.apiBaseUrl,
          lessonApiBaseUrl: remote.lessonApiBaseUrl,
        });
        layout?.setStatus("");
      };

      layout = layoutModule.mount(rootRef.current, {
        version: config.version,
        onNavigate: (app) => void load(app),
      });
      await load("lesson");
    }

    void start().catch((error) => {
      if (rootRef.current)
        rootRef.current.textContent =
          error instanceof Error
            ? error.message
            : "애플리케이션을 불러올 수 없습니다.";
    });

    return () => {
      cancelled = true;
      disposeFeature?.();
      layout?.unmount();
    };
  }, []);

  return <div className="shell-root" ref={rootRef} />;
}
