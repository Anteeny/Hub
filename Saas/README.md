# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

# Storeflow

Multi-tenant POS SaaS foundation for retail and food service businesses.

## Phase 1

- Vite + React + TypeScript frontend
- Tailwind CSS v4 integration
- Supabase client configuration via environment variables
- PostgreSQL migration with tenant-scoped tables, indexes, and RLS policies
- Light-themed operations workspace shell

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and provide the Supabase project URL and anonymous key before connecting application data.

The migration at `supabase/migrations/202609150001_initial_schema.sql` is intended to run through the Supabase CLI or SQL editor. Validate it in a Supabase project before applying it to production.

## Commands

```bash
npm run build
npm run lint
```
