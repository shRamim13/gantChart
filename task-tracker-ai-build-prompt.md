# Build prompt: Team task tracker (Excel + Jira hybrid)

Copy everything below into your AI builder (Bolt.new, Lovable, Cursor, v0, etc.) as the project brief.

---

## Project overview

Build a modern, professional internal task/project tracker for a 6-7 person team, replacing an Excel-based tracker. The core idea: **one dataset, multiple interchangeable views** — a spreadsheet-style Table view (familiar, Excel-like) and a Jira-style Board/Timeline view, both editing the same underlying data live.

**Tech stack:**
- Frontend: React (Vite), Tailwind CSS
- Backend: Supabase (Postgres database + Auth + Realtime + Storage)
- Hosting: Vercel (frontend) — connects directly to Supabase, no separate backend server needed
- Table/grid component: TanStack Table (for the Excel-style view)
- Drag-and-drop: dnd-kit (for Kanban board and Gantt resizing)

---

## Database schema (Supabase / Postgres)

```sql
-- Users (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id),
  name text not null,
  email text not null,
  role text not null default 'editor', -- admin | editor | viewer
  avatar_url text
);

-- Projects (top-level grouping, e.g. "UI Revamp")
create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp default now()
);

-- Epics (groups of related tasks within a project)
create table epics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  color text default '#7F77DD'
);

-- Modules (matches your sheet's "Page" column, e.g. Homepage, PDP, Checkout)
create table modules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null
);

-- Tasks (the core table — every view renders from this)
create table tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  epic_id uuid references epics(id),
  module_id uuid references modules(id),
  assignee_id uuid references profiles(id),
  title text not null,
  description text,
  status text not null default 'todo', -- todo | in_progress | in_review | blocked | done
  priority text default 'medium',      -- low | medium | high
  severity text default 'low',         -- low | medium | high | critical
  est_hours numeric,
  est_days numeric,
  start_date date,
  due_date date,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Comments
create table comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references profiles(id),
  body text not null,
  created_at timestamp default now()
);

-- Attachments
create table attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  file_url text not null,
  file_name text,
  created_at timestamp default now()
);

-- Activity log (for the audit trail feature)
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references profiles(id),
  action text not null, -- created | status_changed | assigned | edited | deleted
  detail text,
  created_at timestamp default now()
);

-- Row Level Security: enable on all tables, then add policies
-- so only authenticated team members can read/write.
alter table tasks enable row level security;
create policy "team members can read tasks" on tasks for select using (auth.role() = 'authenticated');
create policy "team members can edit tasks" on tasks for all using (auth.role() = 'authenticated');
-- repeat similar policies for other tables; tighten later for admin-only actions (e.g. delete project)
```

---

## Core features to implement

### Phase 1 — MVP (build this first)
1. **Auth** — Supabase email/password login. Store role (admin/editor/viewer) in `profiles`.
2. **Projects list** — landing page shows all projects as cards.
3. **Task CRUD** — create, edit, delete, duplicate a task. Full form: title, description, status, priority, severity, assignee, module, epic, dates, estimation.
4. **Table view** — spreadsheet-style grid (TanStack Table). Inline cell editing, sortable columns, filter by status/assignee/module, search bar.
5. **Realtime sync** — use Supabase Realtime so edits from one teammate appear live for everyone else, no refresh needed.

### Phase 2 — Jira-style views
6. **Board (Kanban) view** — columns = status (To Do / In Progress / In Review / Blocked / Done). Drag cards between columns updates `status` in the database instantly.
7. **Timeline (Gantt) view** — tasks rendered as horizontal bars using `start_date`/`due_date`. Drag edges to resize duration, drag bar to shift dates.
8. **View switcher** — a tab/toggle at the top of each project: `Table | Board | Timeline`. All three read/write the same `tasks` table — switching views never loses or duplicates data.
9. **Epics** — group tasks under an epic; show an epic-level progress bar (e.g. "6/10 done").
10. **Rollups** — auto-calculated totals: hours/days per module, per assignee, per epic.

### Phase 3 — polish
11. **Task detail panel** — clicking a row/card opens a slide-over panel with comments, attachments, and activity log (like clicking into a Jira ticket).
12. **Notifications** — in-app or email alert when a task is due soon or overdue.
13. **Dark mode** toggle.
14. **Shareable read-only links** for stakeholders outside the team.

---

## UI / design direction

Make this feel like a modern SaaS product (Linear, ClickUp, Notion), not a form-heavy admin panel:

- Clean, minimal layout with generous white space, no visual clutter
- Sidebar navigation: project list, then within a project: Table / Board / Timeline tabs
- Top bar: search, filters, "+ New task" button
- Color-coded pills for status, priority, and severity (not plain text)
- Assignee avatars instead of plain names
- Progress bars/rings for epic and project completion, not raw numbers
- Smooth, subtle transitions on drag-and-drop and view switching
- Rounded cards (12px radius), soft borders, no heavy drop shadows
- Dark mode built in from the start, not bolted on later
- Command bar / quick search (Cmd+K style) to jump to any task fast

---

## Why this is easy to extend later

Because every view (Table, Board, Timeline) reads from the same `tasks` table, adding new capability later is additive, not a rewrite:
- Task dependencies ("Task B starts after Task A") → add a `task_dependencies` join table, only affects Timeline view
- Custom workflows per project → make `status` values configurable per project instead of hardcoded
- Time tracking → add a `time_entries` table linked to `tasks`
- Multiple assignees → change `assignee_id` to a join table `task_assignees`

None of these require touching the existing schema's core structure — they're new tables or new columns, which is exactly why this design was chosen over a rigid, harder-to-change alternative.

---

## Build instructions for the AI agent

1. Scaffold a Vite + React + Tailwind project.
2. Set up Supabase project, run the schema SQL above, enable RLS policies.
3. Build auth flow first (login/logout, session persistence).
4. Build the Table view end-to-end (CRUD + realtime) before starting Board/Timeline — this is the foundation all other views reuse.
5. Add Board view as a second renderer of the same task data.
6. Add Timeline/Gantt view as a third renderer.
7. Add the task detail slide-over panel (comments, attachments, activity log) last, once core views work.
8. Deploy frontend to Vercel, connect Supabase environment variables.
