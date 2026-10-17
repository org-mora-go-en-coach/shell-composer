import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const shellDirectory = fileURLToPath(new URL("../", import.meta.url));
const workspaceDirectory = fileURLToPath(new URL("../../", import.meta.url));
const services = [
  ["shell-composer", shellDirectory],
  ["mfe-lesson", `${workspaceDirectory}mfe-lesson`],
  ["mfe-user", `${workspaceDirectory}mfe-user`],
  ["api-lesson", `${workspaceDirectory}api-lesson`],
  ["api-user", `${workspaceDirectory}api-user`],
];

const children = services.map(([name, cwd]) => {
  const child = spawn("npm", ["run", "dev"], { cwd, stdio: "inherit", env: process.env });
  child.on("exit", (code, signal) => {
    if (code && !signal) {
      console.error(`[${name}] exited with code ${code}; stopping the local stack.`);
      stop("SIGTERM");
      process.exitCode = code;
    }
  });
  return child;
});

function stop(signal) {
  for (const child of children) if (!child.killed) child.kill(signal);
}

process.once("SIGINT", () => { stop("SIGINT"); process.exit(130); });
process.once("SIGTERM", () => { stop("SIGTERM"); process.exit(143); });

await Promise.all(children.map((child) => new Promise((resolve) => child.once("exit", resolve))));
