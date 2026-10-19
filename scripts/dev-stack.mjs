import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const shellDirectory = fileURLToPath(new URL("../", import.meta.url));
const workspaceDirectory = fileURLToPath(new URL("../../", import.meta.url));
const npmCli = process.env.npm_execpath;
const lessonApiPort = process.env.API_LESSON_PORT ?? "4201";
const services = [
  ["shell-composer", shellDirectory],
  ["mfe-lesson", `${workspaceDirectory}mfe-lesson`],
  ["mfe-user", `${workspaceDirectory}mfe-user`],
  ["mfe-layout", `${workspaceDirectory}mfe-layout`],
  ["api-lesson", `${workspaceDirectory}api-lesson`],
  ["api-user", `${workspaceDirectory}api-user`],
];

const children = services.map(([name, cwd]) => {
  const env =
    name === "shell-composer"
      ? {
          ...process.env,
          NEXT_PUBLIC_API_LESSON_URL: `http://localhost:${lessonApiPort}`,
        }
      : process.env;
  const child =
    name === "api-lesson" && lessonApiPort !== "4201"
      ? spawn(
          process.execPath,
          ["node_modules/next/dist/bin/next", "dev", "-p", lessonApiPort],
          {
            cwd,
            stdio: "inherit",
            env,
          },
        )
      : npmCli
        ? spawn(process.execPath, [npmCli, "run", "dev"], {
            cwd,
            stdio: "inherit",
            env,
          })
        : spawn(
            process.platform === "win32" ? "npm.cmd" : "npm",
            ["run", "dev"],
            {
              cwd,
              stdio: "inherit",
              env,
              shell: process.platform === "win32",
            },
          );
  child.on("exit", (code, signal) => {
    if (code && !signal) {
      console.error(
        `[${name}] exited with code ${code}; stopping the local stack.`,
      );
      stop("SIGTERM");
      process.exitCode = code;
    }
  });
  return child;
});

function stop(signal) {
  for (const child of children) if (!child.killed) child.kill(signal);
}

process.once("SIGINT", () => {
  stop("SIGINT");
  process.exit(130);
});
process.once("SIGTERM", () => {
  stop("SIGTERM");
  process.exit(143);
});

await Promise.all(
  children.map(
    (child) => new Promise((resolve) => child.once("exit", resolve)),
  ),
);
