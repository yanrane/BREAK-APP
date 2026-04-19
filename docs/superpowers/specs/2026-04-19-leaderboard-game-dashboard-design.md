# Design: Leaderboard + Reaction Time Game + Dashboard

> Phase 1 completion — implements the three remaining stub features.

**Date:** 2026-04-19
**Scope:** Backend services, API routes, frontend pages, integration & unit tests

---

## 1. Goals

Complete Phase 1 of BREAK by implementing:
1. **Leaderboard** — weekly/monthly/alltime top-50 ranking by points
2. **Reaction Time Game** — 5-round reaction game with scoring, daily point cap
3. **Dashboard** — aggregated overview page showing points, streak, missions, leaderboard position

---

## 2. Schema Change

Add `pointsEarned` to `GameScore` so period-based leaderboard queries can sum game points accurately without recalculating from raw scores at query time.

```prisma
model GameScore {
  id           String   @id @default(cuid())
  userId       String
  gameType     GameType
  score        Int                      // raw reaction score (0–1000)
  pointsEarned Int      @default(0)    // points awarded this session (0 if daily cap hit)
  playedAt     DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id])
}
```

**Migration:** `prisma migrate dev --name add-points-earned-to-game-score`

---

## 3. Backend

### 3.1 Game Service (`apps/api/src/services/gameService.ts`)

**`calculateGamePoints(score: number): number`**

Pure function. Maps average raw score (0–1000) to points awarded:

| Score range | Points |
|-------------|--------|
| 800–1000    | 5      |
| 600–799     | 4      |
| 400–599     | 3      |
| 200–399     | 2      |
| 0–199       | 1      |

Input is clamped to 0–1000 before lookup (defense against frontend bugs).

**`submitScore(userId, gameType, rawScore): Promise<GameScore>`**

1. Clamp `rawScore` to 0–1000
2. Calculate `candidate = calculateGamePoints(rawScore)`
3. Query `sum(GameScore.pointsEarned)` for user today (WIB midnight via `getWIBStartOfDay()`)
4. `pointsEarned = Math.max(0, Math.min(candidate, 20 - accumulatedToday))`
5. Create `GameScore` record
6. If `pointsEarned > 0`: increment `User.totalPoints`
7. Return saved `GameScore`

**`getMyStats(userId): Promise<GameStatsResult>`**

Returns all `GameScore` records for user, ordered by `playedAt desc`, with aggregate per `gameType`:
- `bestScore`, `totalSessions`, `totalPointsEarned`

### 3.2 Leaderboard Service (`apps/api/src/services/leaderboardService.ts`)

**`getLeaderboard(period, limit = 50): Promise<LeaderboardEntry[]>`**

```
LeaderboardEntry = { rank, userId, username, avatarUrl, points }
```

- **`alltime`** — `SELECT id, username, avatarUrl, totalPoints FROM User ORDER BY totalPoints DESC LIMIT 50`
- **`weekly`** — `periodStart = now - 7 days`; sum `UserMission.pointsEarned WHERE verifiedAt >= periodStart` + sum `GameScore.pointsEarned WHERE playedAt >= periodStart`, grouped by userId, joined with User, sorted desc. Exclude users with 0 points.
- **`monthly`** — same as weekly but `periodStart = now - 30 days`

Implementation uses Prisma `groupBy` + `_sum` for each source, then merges in-memory (two queries, merge by userId, sort). Keeps it ORM-only without raw SQL.

### 3.3 Routes

**`apps/api/src/routes/games.ts`** — replace stubs:
- `POST /games/submit` — `requireAuth` → validate `{ gameType, score }` with Zod → call `submitScore`
- `GET /games/my-stats` — `requireAuth` → call `getMyStats`

**`apps/api/src/routes/leaderboard.ts`** — replace stub:
- `GET /leaderboard?period=weekly|monthly|alltime&limit=50` — `requireAuth` → validate period (default `weekly`), parse `limit` (default 50, max 50) → call `getLeaderboard`

---

## 4. Frontend

### 4.1 Leaderboard Page (`apps/web/src/pages/Leaderboard.tsx`)

- **Hook `useLeaderboard(period)`** in `features/leaderboard/useLeaderboard.ts` — fetches `/leaderboard?period=<period>`
- **Tab switcher:** "Mingguan" | "Bulanan" | "Semua Waktu" — changing tab re-fetches
- **List:** rank badge + avatar (initials fallback) + username + points. Top 3 get gold/silver/bronze styling.
- **Self-highlight:** compare each entry's `userId` with `useAuthStore().user.id` — highlight with brand color border
- **States:** loading skeleton (5 rows), empty state, error with retry

### 4.2 Reaction Time Game (`apps/web/src/features/games/ReactionGame.tsx`)

State machine with 5 states:

```
idle → waiting → ready → clicked → roundResult → (next round | sessionResult)
```

- **`idle`** — "Mulai" button
- **`waiting`** — gray screen, random delay 2000–6000ms via `setTimeout`
- **`ready`** — screen turns green, timestamp recorded
- **`clicked`** (during `waiting`) — "Terlalu cepat! Coba lagi" — resets round, does not count
- **`clicked`** (during `ready`) — compute `reactionMs = Date.now() - readyTimestamp`, `roundScore = clamp(1000 - reactionMs, 0, 1000)` — show result
- After 5 valid rounds → **`sessionResult`**: show average score, estimated points, "Kirim & Simpan" button
- On submit: POST `/games/submit` → show points awarded (or cap message if `pointsEarned = 0`)

**Anti-false-click:** `setTimeout` handle stored in `useRef`, cleared on unmount to prevent state updates after component unmounts.

### 4.3 Games Page (`apps/web/src/pages/Games.tsx`)

- Header + description
- Renders `<ReactionGame />`
- Placeholder cards for Fast Click and Pattern Match (Phase 2, visually disabled with "Segera Hadir" badge)

### 4.4 Dashboard Page (`apps/web/src/pages/Dashboard.tsx`)

- **Hook `useDashboard()`** in `features/dashboard/useDashboard.ts` — fires 3 parallel requests: `GET /me`, `GET /missions/today`, `GET /leaderboard?period=weekly&limit=5`
- **4 stat cards:** Total Poin, Streak (hari), Misi Hari Ini (X/3 completed), Ranking Minggu Ini (#N atau "–" jika tidak masuk top 50)
- **Mini leaderboard:** top 5 weekly entries
- **Quick links:** CTA ke `/missions` dan `/games`

---

## 5. Testing

### Unit Tests

**`gameService.test.ts`:**
- `calculateGamePoints` — test all thresholds: 0, 199, 200, 399, 400, 599, 600, 799, 800, 1000
- `calculateGamePoints` with out-of-range input: -50 → clamped → 1pt; 1500 → clamped → 5pt
- Daily cap logic: accumulated=18, candidate=5 → `pointsEarned=2`
- Daily cap full: accumulated=20, candidate=5 → `pointsEarned=0`

### Integration Tests

**`games.integration.test.ts`:**
- POST `/games/submit` → 200, `GameScore` created, `User.totalPoints` incremented
- POST `/games/submit` × N until cap → subsequent submissions return `pointsEarned=0`, `totalPoints` stops growing
- POST with invalid `gameType` → 400 `INVALID_GAME_TYPE`
- POST without auth → 401
- GET `/games/my-stats` → returns grouped stats with `bestScore`, `totalSessions`

**`leaderboard.integration.test.ts`:**
- GET `/leaderboard?period=weekly` → sorted desc, no zero-point users
- GET `/leaderboard?period=alltime` → includes users with only mission points
- GET without auth → 401
- GET with invalid period → 400 `INVALID_PERIOD`

---

## 6. File Map

**New files — backend:**
- `apps/api/src/services/gameService.ts`
- `apps/api/src/services/gameService.test.ts`
- `apps/api/src/services/leaderboardService.ts`
- `apps/api/src/test/games.integration.test.ts`
- `apps/api/src/test/leaderboard.integration.test.ts`

**Modified files — backend:**
- `apps/api/prisma/schema.prisma` — add `pointsEarned` to `GameScore`
- `apps/api/src/routes/games.ts` — replace stubs
- `apps/api/src/routes/leaderboard.ts` — replace stub

**New files — frontend:**
- `apps/web/src/features/games/ReactionGame.tsx`
- `apps/web/src/features/leaderboard/useLeaderboard.ts`
- `apps/web/src/features/dashboard/useDashboard.ts`

**Modified files — frontend:**
- `apps/web/src/pages/Games.tsx` — replace stub
- `apps/web/src/pages/Leaderboard.tsx` — replace stub
- `apps/web/src/pages/Dashboard.tsx` — replace stub

---

## 7. Out of Scope (Phase 2)

- Anti-cheat / game score validation server-side
- Real-time leaderboard (WebSocket)
- Manual game score moderation
- Fast Click + Pattern Match games
- Streak bonus (+50 pts at 7-day streak)
- `showOnLeaderboard` opt-out setting
