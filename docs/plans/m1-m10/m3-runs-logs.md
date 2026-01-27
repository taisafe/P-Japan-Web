# Plan M3: Manual Update Run & Logs

## Goal Description
Implement a robust manual trigger mechanism for the news fetching pipeline and a real-time log viewer to monitor system activities.

## Design Decisions
- **UI Interaction**: Global Drawer (Sheet) accessible from the Sidebar footer. This allows users to trigger updates from any page without navigation.
- **Log Persistence**: Logs will be stored in the SQLite database (`system_logs` table) rather than ephemeral memory. This ensures history is preserved for debugging.
- **Real-time Updates**: The frontend will poll the log API every 2 seconds when the drawer is open to simulate real-time updates.

## Proposed Changes

### Database Schema (SQLite)
- **Table**: `system_logs`
    - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
    - `level`: TEXT (INFO, WARN, ERROR)
    - `message`: TEXT
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
    - `run_id`: TEXT (optional, links log to a specific fetch run)

### Backend API
- `POST /api/system/run`: Triggers a new fetch run (if not already running).
- `GET /api/system/logs`: Returns the latest 50-100 logs. Supports `after_id` for efficient polling.

### Frontend UI
- **Component**: `SystemMonitorDrawer` (using `Sheet` from shadcn/ui).
- **Trigger**: A "Flash" or "Terminal" icon button in the `AppSidebar` footer.
- **Display**: scrollable log area with timestamp and color-coded levels.

## Verification Plan
- **Manual Test**: Click the trigger button, ensure the drawer opens, and logs start appearing.
- **Persistence Test**: Refresh the page and reopen the drawer; previous logs should still be visible.
