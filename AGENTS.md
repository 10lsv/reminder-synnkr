<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Test iPhone : NE PAS utiliser `pnpm dev`

Sur iOS Safari accédé via LAN (`http://192.168.x.x:3000`), le WebSocket HMR de Turbopack échoue avec `cannot parse response`. L'erreur n'apparaît qu'en mode dev, et empêche l'hydration React de se compléter : la page s'affiche, les `<form action>` natifs marchent, mais **tous les `onClick` sont morts**.

Pour tester sur iPhone :
- `pnpm build && pnpm start` (mode production, pas de HMR) — accès iPhone via `http://192.168.x.x:3000`
- ou Vercel preview deploy (URL HTTPS publique)

Pour itérer rapidement, utilise Mac/Chrome avec `pnpm dev`. iPhone uniquement quand tu veux valider.
