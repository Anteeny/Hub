# Storeflow workspace instructions

- Keep the interface strictly light themed and optimized for touch-friendly POS workflows.
- Every business-owned database record must carry `tenant_id` and be protected by Supabase RLS.
- Keep historical sale prices and costs on `sale_items`; do not derive historical reporting from current catalog values.
- Use the existing Vite, React, TypeScript, Tailwind, and Supabase stack.
- Run `npm run build` and `npm run lint` after implementation changes.