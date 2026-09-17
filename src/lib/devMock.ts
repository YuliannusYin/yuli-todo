/* Dev-only in-memory backend for browser preview and UI automation.
   Stripped from production bundles by the import.meta.env.DEV guard in ipc.ts. */
import { DEFAULT_SETTINGS, type Settings, type Tag, type Task, type TaskType } from "./types";

const SETTINGS_KEY = "yuli-dev-settings";

let settings: Settings = loadSettings();

function loadSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
    }
  } catch {
    // Private mode or corrupted value: fall back to defaults.
  }
  return { ...DEFAULT_SETTINGS };
}

function persistSettings() {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage failures in the mock.
  }
}

function isoOffset(days: number, hours = 0, minutes = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(date.getHours() + hours, date.getMinutes() + minutes, 0, 0);
  return date.toISOString();
}

let types: TaskType[] = [
  { id: "t-work", name: "Work", sort_order: 0, in_use: true },
  { id: "t-personal", name: "Personal", sort_order: 1, in_use: true },
  { id: "t-study", name: "Study", sort_order: 2, in_use: false },
];

const tag = (name: string) => ({ id: `tag-${name}`, name });

let tasks: Task[] = [
  {
    id: "b1",
    name: "Prepare Q3 roadmap draft",
    type_id: "t-work",
    type_name: "Work",
    content: "Outline goals, key results, and staffing needs for the review.",
    notes: "Bring printed copies.",
    tags: [tag("planning"), tag("urgent")],
    start_at: null,
    end_at: isoOffset(0, 4, 0),
    status: "to_do",
    board_column: "todo",
    doing_elapsed_seconds: 0,
    completed_at: null,
    archived_at: null,
    created_at: isoOffset(-2),
    updated_at: isoOffset(-1),
  },
  {
    id: "b2",
    name: "Reply to landlord about the lease renewal",
    type_id: "t-personal",
    type_name: "Personal",
    content: "",
    notes: "",
    tags: [tag("admin")],
    start_at: null,
    end_at: null,
    status: "to_do",
    board_column: "todo",
    doing_elapsed_seconds: 0,
    completed_at: null,
    archived_at: null,
    created_at: isoOffset(-3),
    updated_at: isoOffset(-2),
  },
  {
    id: "b3",
    name: "Submit expense report for the Berlin trip",
    type_id: "t-work",
    type_name: "Work",
    content: "Flights, hotel, two client dinners.",
    notes: "",
    tags: [tag("finance"), tag("overdue-demo")],
    start_at: isoOffset(-1, -8, 0),
    end_at: isoOffset(-1, -2, 0),
    status: "overdue",
    board_column: "todo",
    doing_elapsed_seconds: 0,
    completed_at: null,
    archived_at: null,
    created_at: isoOffset(-5),
    updated_at: isoOffset(-1),
  },
  {
    id: "b4",
    name: "Book dentist appointment",
    type_id: "t-personal",
    type_name: "Personal",
    content: "",
    notes: "Ask for an early-morning slot.",
    tags: [],
    start_at: null,
    end_at: isoOffset(6, 0, 0),
    status: "to_do",
    board_column: "todo",
    doing_elapsed_seconds: 0,
    completed_at: null,
    archived_at: null,
    created_at: isoOffset(-1),
    updated_at: isoOffset(0),
  },
  {
    id: "b5",
    name: "Design onboarding flow v2",
    type_id: "t-work",
    type_name: "Work",
    content: "Three screens: welcome, first task, theme picker.",
    notes: "",
    tags: [tag("design")],
    start_at: isoOffset(0, -3, 0),
    end_at: isoOffset(0, 6, 0),
    status: "doing",
    board_column: "doing",
    doing_elapsed_seconds: 5400,
    completed_at: null,
    archived_at: null,
    created_at: isoOffset(-1),
    updated_at: isoOffset(0),
  },
  {
    id: "b6",
    name: "Refactor board move logic into a reducer",
    type_id: "t-work",
    type_name: "Work",
    content: "",
    notes: "",
    tags: [tag("code"), tag("tech-debt")],
    start_at: isoOffset(-1, -4, 0),
    end_at: isoOffset(-1, 2, 0),
    status: "overdue",
    board_column: "doing",
    doing_elapsed_seconds: 7200,
    completed_at: null,
    archived_at: null,
    created_at: isoOffset(-4),
    updated_at: isoOffset(0),
  },
  {
    id: "b7",
    name: "Set up CI pipeline for the Tauri build",
    type_id: "t-work",
    type_name: "Work",
    content: "Lint, type-check, vitest, then a Windows release bundle.",
    notes: "",
    tags: [tag("code"), tag("infra")],
    start_at: isoOffset(-1, -2, 0),
    end_at: isoOffset(-1, 3, 0),
    status: "done",
    board_column: "done",
    doing_elapsed_seconds: 7200,
    completed_at: isoOffset(-1, 2, 30),
    archived_at: null,
    created_at: isoOffset(-2),
    updated_at: isoOffset(-1),
  },
  {
    id: "b8",
    name: "Weekly review and inbox zero",
    type_id: "t-personal",
    type_name: "Personal",
    content: "",
    notes: "",
    tags: [tag("review")],
    start_at: isoOffset(-2, 0, 0),
    end_at: isoOffset(-2, 1, 0),
    status: "belated",
    board_column: "done",
    doing_elapsed_seconds: 2700,
    completed_at: isoOffset(-2, 3, 15),
    archived_at: null,
    created_at: isoOffset(-3),
    updated_at: isoOffset(-2),
  },
  {
    id: "s1",
    name: "Prepare slides for the team sync",
    type_id: "t-work",
    type_name: "Work",
    content: "",
    notes: "",
    tags: [tag("meeting")],
    start_at: isoOffset(1, 9 - new Date().getHours(), 0 - new Date().getMinutes()),
    end_at: isoOffset(1, 9 - new Date().getHours(), 30 - new Date().getMinutes()),
    status: "will_do",
    board_column: null,
    doing_elapsed_seconds: 0,
    completed_at: null,
    archived_at: null,
    created_at: isoOffset(0),
    updated_at: isoOffset(0),
  },
  {
    id: "s2",
    name: "Pay rent",
    type_id: "t-personal",
    type_name: "Personal",
    content: "",
    notes: "Transfer before 10:00.",
    tags: [tag("admin")],
    start_at: isoOffset(2, 9, 0),
    end_at: null,
    status: "will_do",
    board_column: null,
    doing_elapsed_seconds: 0,
    completed_at: null,
    archived_at: null,
    created_at: isoOffset(-1),
    updated_at: isoOffset(-1),
  },
  {
    id: "s3",
    name: "Flight to Shanghai · check in online",
    type_id: "t-personal",
    type_name: "Personal",
    content: "",
    notes: "",
    tags: [tag("travel")],
    start_at: isoOffset(5, -2, 0),
    end_at: isoOffset(5, 4, 0),
    status: "will_do",
    board_column: null,
    doing_elapsed_seconds: 0,
    completed_at: null,
    archived_at: null,
    created_at: isoOffset(-2),
    updated_at: isoOffset(-2),
  },
  {
    id: "s4",
    name: "Renew domain registration",
    type_id: "t-work",
    type_name: "Work",
    content: "",
    notes: "",
    tags: [tag("admin"), tag("infra")],
    start_at: isoOffset(11, 10, 0),
    end_at: null,
    status: "will_do",
    board_column: null,
    doing_elapsed_seconds: 0,
    completed_at: null,
    archived_at: null,
    created_at: isoOffset(-4),
    updated_at: isoOffset(-4),
  },
  ...archivedSeed(),
];

function archivedSeed(): Task[] {
  const rows: Array<[string, string, Task["status"], number, number, number, Tag[]]> = [
    ["Archive quarterly receipts", "t-personal", "done", -4, -4, 1500, [tag("admin"), tag("finance")]],
    ["Migrate issue templates to forms", "t-work", "done", -6, -6, 2400, [tag("code")]],
    ["Fix drag-to-column IPC payload", "t-work", "done", -8, -7, 3300, [tag("code"), tag("bug")]],
    ["Draft v0.6 release notes", "t-work", "belated", -10, -9, 1800, [tag("writing")]],
    ["Cancel unused SaaS subscription", "t-personal", "force_ended", -12, -12, 0, [tag("admin")]],
    ["Read \"Designing Data-Intensive Apps\" ch. 4", "t-study", "done", -16, -15, 5400, [tag("reading")]],
    ["Prototype custom title bar", "t-work", "done", -22, -21, 6600, [tag("code"), tag("design")]],
    ["Plan winter holiday itinerary", "t-personal", "belated", -34, -33, 2700, [tag("travel")]],
    ["Evaluate SQLite backup options", "t-work", "force_ended", -41, -40, 900, [tag("research")]],
  ];
  return rows.map(([name, typeId, status, completedOffset, archivedOffset, elapsed, tags], index) => ({
    id: `a${index + 1}`,
    name,
    type_id: typeId,
    type_name: types.find((item) => item.id === typeId)?.name ?? null,
    content: "",
    notes: "",
    tags,
    start_at: isoOffset(completedOffset - 1, 9, 0),
    end_at: isoOffset(completedOffset - 1, 12, 0),
    status: status as Task["status"],
    board_column: null,
    doing_elapsed_seconds: elapsed,
    completed_at: isoOffset(completedOffset, 14, 0),
    archived_at: isoOffset(archivedOffset, 14, 30),
    created_at: isoOffset(completedOffset - 3),
    updated_at: isoOffset(archivedOffset),
  }));
}

let nextId = 100;

function deriveType(id: string | null): string | null {
  return types.find((item) => item.id === id)?.name ?? null;
}

function refreshInUse() {
  for (const item of types) {
    item.in_use = tasks.some((task) => task.type_id === item.id);
  }
}

function writeToTask(id: string, payload: unknown): Task {
  const data = payload as Task;
  const startFuture = data.start_at ? new Date(data.start_at).getTime() > Date.now() : false;
  const existing = tasks.find((task) => task.id === id);
  const base: Task = existing ?? {
    id,
    content: "",
    notes: "",
    tags: [],
    end_at: null,
    doing_elapsed_seconds: 0,
    completed_at: null,
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: "to_do",
    board_column: "todo",
    start_at: null,
    name: "",
    type_id: null,
    type_name: null,
  };
  const merged: Task = {
    ...base,
    name: data.name,
    type_id: data.type_id,
    type_name: deriveType(data.type_id),
    content: data.content,
    notes: data.notes,
    tags: data.tags,
    start_at: data.start_at,
    end_at: data.end_at,
    updated_at: new Date().toISOString(),
  };
  if (startFuture) {
    merged.status = "will_do";
    merged.board_column = null;
  } else if (merged.board_column === null && !merged.archived_at) {
    merged.status = "to_do";
    merged.board_column = "todo";
  }
  return merged;
}

export async function mockInvoke(
  command: string,
  args?: Record<string, unknown>,
): Promise<unknown> {
  await new Promise((resolve) => window.setTimeout(resolve, 120));

  switch (command) {
    case "get_settings":
      return { ...settings };
    case "update_settings": {
      settings = { ...settings, ...(args?.patch as Partial<Settings>) };
      persistSettings();
      return { ...settings };
    }
    case "get_storage_info":
      return { path: "C:\\Users\\dev\\AppData\\Roaming\\com.yuli.todo\\yuli.db" };
    case "list_tasks": {
      const surface = args?.surface as "board" | "scheduled" | "archive";
      if (surface === "board") {
        return tasks
          .filter((task) => task.board_column !== null)
          .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      }
      if (surface === "scheduled") {
        return tasks
          .filter((task) => task.status === "will_do")
          .sort(
            (a, b) =>
              (a.start_at ?? "").localeCompare(b.start_at ?? ""),
          );
      }
      return tasks
        .filter((task) => task.archived_at !== null)
        .sort((a, b) => (b.archived_at ?? "").localeCompare(a.archived_at ?? ""));
    }
    case "get_task":
      return tasks.find((task) => task.id === args?.id);
    case "create_task": {
      const id = `d${nextId++}`;
      const task = writeToTask(id, args?.payload);
      tasks.push(task);
      refreshInUse();
      return task;
    }
    case "update_task": {
      const id = String(args?.id);
      const task = writeToTask(id, args?.payload);
      tasks = tasks.map((item) => (item.id === id ? task : item));
      refreshInUse();
      return task;
    }
    case "list_types":
      refreshInUse();
      return types.map((item) => ({ ...item }));
    case "create_type": {
      const created: TaskType = {
        id: `t${nextId++}`,
        name: String(args?.name ?? ""),
        sort_order: types.length,
        in_use: false,
      };
      types.push(created);
      return created;
    }
    case "rename_type": {
      const item = types.find((type) => type.id === args?.id);
      if (item) {
        item.name = String(args?.name ?? item.name);
        for (const task of tasks) {
          if (task.type_id === item.id) {
            task.type_name = item.name;
          }
        }
      }
      return null;
    }
    case "delete_type": {
      if (tasks.some((task) => task.type_id === args?.id)) {
        throw { code: "TYPE_IN_USE", messageKey: "error.typeInUse" };
      }
      types = types.filter((item) => item.id !== args?.id);
      return null;
    }
    case "move_task": {
      const item = tasks.find((task) => task.id === args?.id);
      if (item) {
        const to = String(args?.toColumn) as Task["board_column"];
        item.board_column = to;
        if (to === "done") {
          const overdue = item.end_at && Date.now() > new Date(item.end_at).getTime();
          item.status = overdue ? "belated" : "done";
          item.completed_at = new Date().toISOString();
        } else if (to === "doing") {
          item.status =
            item.end_at && Date.now() > new Date(item.end_at).getTime() ? "overdue" : "doing";
        } else {
          item.status =
            item.end_at && Date.now() > new Date(item.end_at).getTime() ? "overdue" : "to_do";
        }
        item.updated_at = new Date().toISOString();
      }
      return item;
    }
    case "archive_now": {
      const item = tasks.find((task) => task.id === args?.id);
      if (item) {
        if (item.status !== "done" && item.status !== "belated") {
          item.status = "force_ended";
        }
        item.archived_at = new Date().toISOString();
        item.completed_at ??= new Date().toISOString();
        item.board_column = null;
        item.updated_at = new Date().toISOString();
      }
      return item;
    }
    case "delete_task": {
      const item = tasks.find((task) => task.id === args?.id);
      if (!item?.archived_at) {
        throw { code: "NOT_ARCHIVED", messageKey: "error.notArchived" };
      }
      tasks = tasks.filter((task) => task.id !== args?.id);
      refreshInUse();
      return null;
    }
    default:
      throw new Error(`[devMock] unknown command: ${command}`);
  }
}
