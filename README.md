# shell-composer

Next.js application shell for the English Coach micro frontend system. It fetches the runtime manifest from `NEXT_PUBLIC_SHELL_CONFIG_URL`, then dynamically mounts the selected versioned ESM remote.

## Local development

```bash
npm run dev:stack
```

Run this command from `shell-composer` after installing dependencies in all repositories. It starts the shell on port 3000, `mfe-lesson` on 4173, `mfe-user` on 4174, `mfe-layout` on 4175, `api-lesson` on 3001, and `api-user` on 3002. The shell contains orchestration only; all visible application chrome belongs to `mfe-layout`.

The development manifest imports each MFE directly from its Vite source module. Vite React Fast Refresh and HMR therefore remain active inside the Next.js shell: editing an MFE component or stylesheet updates the mounted view without restarting the stack or rebuilding a CDN bundle.

Use `npm run dev` when only the shell is needed. Set `NEXT_PUBLIC_SHELL_CONFIG_URL` to override the checked-in development manifest.

## Production

Set `NEXT_PUBLIC_SHELL_CONFIG_URL` to the deployed `shell-config/config.json` URL in Vercel. CORS must remain enabled on the remote and API deployments.

