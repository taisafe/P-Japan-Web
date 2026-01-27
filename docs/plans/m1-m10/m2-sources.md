# Plan M2: Source Management & Manual Entry

## Goal Description
Implement full-page management for news sources and a dedicated manual entry interface for Twitter (X) and paywalled content.

## Technical Specifications
- **Source Weighting**: Add `weight` (1.0-5.0) to `sources` table to influence heat score.
- **Manual Entry UI**: Full-page forms for adding Articles/Tweets (no modals).
- **Twitter Logic**: User manually enters content, author, and timestamp (Option C).

## Proposed Changes
### Data Layer Updates
- [MODIFY] `src/lib/db/schema/index.ts`: Add `weight` to `sources`.
- [NEW] CRUD API for Sources: `/api/sources`.

### User Interface (Full Page)
- [NEW] `/sources` Page: A clean, list-based view for managing all JP/EN media sources.
    - [NEW] `/sources/new` Page: Form to add a new source with weight selection.
- [NEW] `/manual-entry` Page: A premium writing interface for manual context/twitter pastes.
    - Fields: Author, Platform (Twitter/web), Content, URL, Weight supplement.

## Verification Plan
- Add a source with weight 3.0 and verify DB entry.
- Manually enter a "Tweet" and check if it appears in the (yet to be built) dashboard feed accurately.
