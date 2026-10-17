# shell-composer

Next.js application shell for the English Coach micro frontend system. It fetches the runtime manifest from `NEXT_PUBLIC_SHELL_CONFIG_URL`, then dynamically mounts the selected versioned ESM remote.

## Local development

```bash
npm install
npm run dev
```

Start `mfe-lesson` on port 4173, `mfe-user` on port 4174, `api-lesson` on port 3001, and `api-user` on port 3002. Without an environment variable, the checked-in local manifest is used.

## Production

Set `NEXT_PUBLIC_SHELL_CONFIG_URL` to the deployed `shell-config/config.json` URL in Vercel. CORS must remain enabled on the remote and API deployments.

