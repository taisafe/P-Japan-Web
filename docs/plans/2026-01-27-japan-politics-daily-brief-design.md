# Japan Politics Daily Brief Web - Design Document

## 1. Overview
**Project Name:** Japan Politics Daily Brief Web  
**Positioning:** A local, single-user Web App for tracking Japanese and English political news. It aggregates events, calculates heat scores, provides dual-column reading with translation, and generates a "Daily Brief".
**Deployment:** Single Docker container with local SQLite persistence.

## 2. Goals & Success Criteria
**Goals:**
1.  **Time Window:** Taipei Time (UTC+8) 00:00 - 23:59:59.
2.  **Event Aggregation:** Merge multi-source reports for the same event.
3.  **On-Demand Translation:** Full-text translation to Simplified Chinese only when clicked.
4.  **Daily Brief:** Generate a summarized brief in Simplified Chinese, copyable.
5.  **Configurable:** Sources, weights, AI providers, thresholds configurable via UI.
6.  **Persistence:** Handle paywalls (keep metadata), support manual full-text paste.

**Success Criteria:**
1.  UI shows scrape progress and stats.
2.  Events traceable to source URL/Time.
3.  Heat Score (0-100) with breakdown.
4.  Dual-column reader (Original/CN).
5.  Daily Brief generation.
6.  Data persists after container restart.

## 3. Architecture & Tech Stack
**Hard Constraints:**
-   **Framework:** Next.js (App Router recommended).
-   **Container:** Single Docker container for Web + Worker + DB (SQLite file).
-   **Database:** SQLite (local file mounted via volume).
-   **No External DB:** No Supabase.
-   **Update Mechanism:** Manual trigger only (no cron).

**Components:**
1.  **Frontend (Next.js):** UI for events, reading, settings, manual triggers.
2.  **Backend (Next.js API Routes):** API for frontend, trigger worker.
3.  **Worker:** Background process (spawned or internal) for scraping/processing.
4.  **AI Layer:** Abstracted provider pattern (External APIs for Embedding, Translation, Summary).

## 4. Key Logic Specifications

### Time & Timezone
-   **Reference:** Asia/Taipei (UTC+8).
-   **Window:** Daily 00:00:00 to 23:59:59.999.

### Scouting & Sources
-   **Sources:** JP Media (Whitelist), EN Media, Twitter (RSS/Scraping).
-   **Strategy:** RSS preferred, HTML fallback.
-   **Paywalls:** Keep metadata (URL, Title, Time), mark as "Need Content". Manual paste supported.

### Event Aggregation
-   **Method:** Strict merging.
-   **Signals:** URL Fingerprint, Title Similarity, Embedding Similarity, Entity Overlap, Time Proximity.
-   **Representation:** One Main Article + Supplementary Sources.

### Heat Score (0-100)
-   **Signals:** Recency (12h half-life), Source Authority, Coverage, Twitter Signal (if avail), Update Momentum, Breaking Tags.
-   **Debias:** Dampen repeated signals from same source.

### Translation & Brief
-   **Translation:** On-demand (User click), saved to DB.
-   **Brief:** Batch generation for daily events. Sections: Election, Parliament, Parties, People, Policy.
-   **Language:** Simplified Chinese.

## 5. Data Model (SQLite)
Tables:
-   `sources`
-   `fetch_runs`
-   `articles`
-   `article_contents`
-   `events`
-   `event_articles`
-   `people` (Wiki synced)
-   `embeddings`
-   `scores`
-   `translations`
-   `summaries`
-   `ai_providers`

## 6. Milestones (Phased Implementation)
-   **M1:** Project Skeleton & Persistence (Next.js + SQLite + Docker).
-   **M2:** Source Management (CRUD).
-   **M3:** Manual Update Run & Logs.
-   **M4:** Content Extraction & Manual Paste.
-   **M5:** Event Merging & Timeline.
-   **M6:** Scoring & Debias.
-   **M7:** Translation & Reader.
-   **M8:** Daily Brief.
-   **M9:** People Console.
-   **M10:** Docker Final Packaging.
