# 📜 Feature Plan: Quest Chronicles & Adventurer's Journal

This document outlines the implementation of a permanent activity history and a persistent note-taking system for GuildBoard.

---

## 1. Feature Analysis: Why we need this
- **Quest Chronicles (History)**: Currently, we only see the *current* state of a quest. We don't know who moved it or when. This feature adds a "Timeline" to every quest.
- **Adventurer's Journal (Notes)**: Developers often find technical details (API keys, logic flow, bugs found) while working. A dedicated note section keeps this info organized and automatically timestamped.

---

## 2. Database Schema Upgrades
We will need two new tables to track this data permanently.

### Table: `task_activities` (The Chronicles)
Tracks every state change and action.
- `id`: primary key
- `task_id`: foreign key to tasks
- `user_id`: who performed the action
- `action_type`: (e.g., 'created', 'started', 'submitted', 'verified', 'deleted')
- `details`: JSON field for extra info (e.g., "Moved from Assigned to In Progress")
- `created_at`: timestamp (automatic)

### Table: `task_notes` (The Journal)
Stores persistent notes for the assignee.
- `id`: primary key
- `task_id`: foreign key to tasks
- `user_id`: the author
- `content`: the actual text
- `created_at`: timestamp (automatic)
- `updated_at`: timestamp (updated on save)

---

## 3. UI/UX Design: "The Quest Journey" 🗺️
We will replace the dry history list with an immersive, animated journey path.

### The Visual Path
- **Vertical Dotted Line**: An animated path that connects each event. Completed events have a "glowing" line; future events are dimmed.
- **Event Nodes (Milestones)**:
  - ✨ **Creation**: "Quest Forged by [Leader]" (Sparkle icon).
  - ⚔️ **Start**: "Adventure Begun by [Member]" (Sword icon).
  - 🛡️ **Council**: "Under Review by the Council" (Shield icon).
  - 🏆 **Victory**: "Legend Verified - [XP] Awarded" (Trophy icon).

### Animations (Framer Motion)
- **Staggered Entrance**: Each milestone in the journey will slide in from the left one by one when the tab is opened.
- **Path Draw**: The vertical line will "draw" itself downward as the user scrolls.
- **Pulse Effect**: The most recent event (the current status) will have a soft, glowing pulse animation to show where the quest currently "stands."

### The "Adventurer's Journal" (Notes)
- A parchment-styled text area.
- Subtle "Saving..." indicator with a quill icon that appears when you stop typing.
- Timestamps for each major note entry, making it look like a real captain's log.

---

## 4. Implementation Roadmap

### Phase 1: Backend (The Core)
1.  **SQL Migrations**: Create the `task_activities` and `task_notes` tables.
2.  **Activity Logging**: Update `taskController.js` to automatically log actions.
3.  **History API**: Create an endpoint that returns the full journey of a task sorted by time.

### Phase 2: Frontend (The UI Evolution)
1.  **Quest Log Page [NEW]**: Create a main navigation page that lists:
    - **Global Chronicles**: A feed of all activities in the guild (who finished what).
    - **Personal Journal**: A collection of all notes you've written, categorized by quest.
2.  **Layout Update**: Add the "Quest Log" icon (Book icon) to the top navbar and mobile bottom navbar.
3.  **Tabbed Modal**: Update `TaskDetailModal.jsx` with the modern tab switcher (keeping the local view as well).
4.  **Journey & Notes Components**: Ensure these components are reusable so they work both in the popup and on the full Quest Log page.

---

## 5. Future AI Synergy
Once we have History and Notes:
- **AI Summary**: The AI can read the *Notes* and *History* to automatically write the "Guild Chronicle" for the month.
- **AI Feedback**: The AI can analyze the member's journal notes to see if they struggled and suggest helpful tips for the next quest.

---

**Plan designed and analyzed by MayazAD for the Beyond Limiter Guild.**
