# shell-composer

Next.js application shell for the English Coach micro frontend system. It fetches the runtime manifest from the independently deployed `shell-config`, then dynamically mounts the selected versioned ESM remote.

## Local development

```bash
npm run dev:stack
```

Run this command from `shell-composer` after installing dependencies in all repositories. It starts the shell on port 4000, `mfe-lesson` on 4101, `mfe-user` on 4102, `mfe-layout` on 4100, `api-lesson` on 4201, and `api-user` on 4202. The shell contains orchestration only; all visible application chrome belongs to `mfe-layout`.

If port 4201 is occupied, set `API_LESSON_PORT` before running the stack (for example, `$env:API_LESSON_PORT=4203` in PowerShell). The shell will use that port for the lesson API.

The development manifest imports each MFE directly from its Vite source module. Vite React Fast Refresh and HMR therefore remain active inside the Next.js shell: editing an MFE component or stylesheet updates the mounted view without restarting the stack or rebuilding a CDN bundle.

Use `npm run dev` when only the shell is needed. Set `NEXT_PUBLIC_SHELL_CONFIG_URL` to override the checked-in development manifest.

## Production

Production always reads `https://shell-config.vercel.app/config.json` with `no-store`; build-time environment variables cannot redirect it to a stale or protected manifest. Once this shell contract is deployed, publishing a new MFE version only requires updating and deploying `shell-config`; the shell does not need to be rebuilt. CORS must remain enabled on the config, remote, and API deployments.
