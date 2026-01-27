# M5: Event Merging & Scoring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Event entity, similarity-based grouping of articles, heat scoring, and a News Feed UI.
**Architecture:** "Event" table in SQLite. Hybrid workflow (High confidence -> Auto-merge, Medium -> Manual review). Similarity Service using OpenAI/compatible API.
**Tech Stack:** Next.js (App Router), Drizzle ORM, Vitest (for logic tests), OpenAI SDK, Shadcn UI.

---

### Task 1: Setup Testing & Dependencies

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`
- Create: `.env.example`

**Step 1: Install Dependencies**
Run: `npm install -D vitest @vitejs/plugin-react jsdom dotenv`
Run: `npm install openai`

**Step 2: Configure Vitest**
Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Step 3: Add Setup Script**
Modify `package.json` to add script `"test": "vitest"`.

**Step 4: Verify**
Run: `npm run test` (Expect success with 0 tests)

### Task 2: Database Schema Update

**Files:**
- Modify: `src/lib/db/schema/index.ts`

**Step 1: Define Events Schema**
In `src/lib/db/schema/index.ts`, add:
```typescript
export const events = sqliteTable('events', {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    summary: text('summary'),
    heatScore: real('heat_score').default(0),
    firstSeenAt: integer('first_seen_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    lastUpdatedAt: integer('last_updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    status: text('status', { enum: ['active', 'archived', 'merged'] }).default('active'),
});

// Update articles table
// Note: We can't easily alter table in sqlite without migration steps, but for dev we push.
// Add fields to 'articles' definition:
// eventId: text('event_id').references(() => events.id),
// matchConfidence: real('match_confidence'),
// matchStatus: text('match_status', { enum: ['confirmed', 'pending', 'rejected'] }),
```

**Step 2: Push Schema**
Run: `npm run db:push`

### Task 3: Similarity Service

**Files:**
- Create: `src/lib/services/similarity.ts`
- Create: `tests/services/similarity.test.ts`

**Step 1: Write Failing Test**
Create `tests/services/similarity.test.ts`.
Test `calculateSimilarity("Same topic", "Same topic")` matches high score.
Test mocking of OpenAI call.

**Step 2: Implement Service**
Create `src/lib/services/similarity.ts`.
Implement `calculateSimilarity(textA, textB)` using OpenAI Embeddings or simple Jaccard/Cosines for MVP if API key missing?
*Plan: strict use of OpenAI or placeholder.*
Code:
```typescript
export async function calculateSimilarity(textA: string, textB: string): Promise<number> {
  // Call OpenAI Embedding or ChatCompletion
  // Return 0.0 to 1.0
}
```

**Step 3: Verify**
Run: `npm run test`

### Task 4: Event Manager Logic

**Files:**
- Create: `src/lib/services/event-manager.ts`
- Create: `tests/services/event-manager.test.ts`

**Step 1: Write Failing Test**
Test `processArticle`:
1. Create mock article.
2. If DB empty, create new Event.
3. If DB matches existing event (mock score > 0.85), merge.
4. If score 0.6-0.85, set 'pending'.

**Step 2: Implement Manager**
`src/lib/services/event-manager.ts`:
- `processArticle(article)`:
  - Query recent events (last 48h).
  - Loop and `calculateSimilarity`.
  - Take best match.
  - Apply Hybrid Logic (Thresholds: 0.85, 0.60).
  - Update `articles` and/or insert `events`.
  - Update `events.lastUpdatedAt` and `heatScore` (simple increment).

**Step 3: Verify**
Run: `npm run test`

### Task 5: Event Feed UI

**Files:**
- Create: `src/components/events/event-card.tsx`
- Create: `src/components/events/event-feed.tsx`
- Modify: `src/app/page.tsx` (or new route)

**Step 1: Event Card Component**
Build `EventCard`:
- Props: `event`, `childArticles`.
- Display: Title, Time, Score, List of articles.

**Step 2: Event Feed Component**
Build `EventFeed`:
- Fetch events (Server Component or useSWR).
- Render list.

**Step 3: Integration**
Add to `src/app/page.tsx` or a new "Feeds" tab.

### Task 6: Manual Review Flow

**Files:**
- Create: `src/components/events/merge-review.tsx`
- Modify: `src/app/layout.tsx` (to include global drawer trigger if needed)

**Step 1: Review Component**
List `pending` matches.
Actions: "Confirm" (update status 'confirmed'), "Reject" (set 'rejected', create new event).

**Step 2: Integrate**
Place in a Drawer or dedicated Admin page.
