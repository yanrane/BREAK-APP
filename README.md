# BREAK — Brain Rot Elimination Awareness Kit

Sistem digital wellness yang memutus loop doomscrolling dan mendorong aktivitas dunia nyata.

## Overview

BREAK terdiri dari tiga komponen:
- **Web App** (`apps/web`) — dashboard misi, leaderboard, mini games
- **API** (`apps/api`) — backend REST API dengan Express + Prisma + PostgreSQL
- **Chrome Extension** (`apps/extension`) — monitor waktu media sosial + notifikasi

## Setup Dev

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL 15+ (lokal)

### Instalasi

```bash
# 1. Install semua dependencies
pnpm install

# 2. Copy env dan isi nilainya
cp .env.example apps/api/.env

# 3. Buat database dan jalankan migrasi
pnpm db:migrate

# 4. Seed mission pool
pnpm db:seed
```

### Jalankan Dev Server

```bash
# API (port 3001)
pnpm --filter @break/api dev

# Web (port 5173)
pnpm --filter @break/web dev

# Extension (build watch)
pnpm --filter @break/extension dev
```

## Struktur Folder

```
break/
├── apps/
│   ├── web/          # React 18 + Vite + TypeScript + Tailwind
│   ├── api/          # Express + TypeScript + Prisma
│   └── extension/    # Chrome Extension Manifest V3
├── packages/
│   └── shared/       # Shared types & Zod schemas
├── .env.example
└── pnpm-workspace.yaml
```

## Commands

| Command | Deskripsi |
|---------|-----------|
| `pnpm install` | Install semua dependencies |
| `pnpm dev` | Jalankan semua app paralel |
| `pnpm build` | Build semua app untuk production |
| `pnpm typecheck` | TypeScript check semua app |
| `pnpm test` | Jalankan semua test |
| `pnpm db:migrate` | Prisma migrate dev |
| `pnpm db:seed` | Seed mission pool |
