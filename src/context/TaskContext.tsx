import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  archiveNow,
  createTask,
  createType,
  deleteType,
  listTasks,
  listTypes,
  moveTask,
  renameType,
  updateTask,
} from "../lib/ipc";
import type { Task, TaskType, TaskWrite } from "../lib/types";

type TaskContextValue = {
  board: Task[];
  scheduled: Task[];
  archive: Task[];
  types: TaskType[];
  toast: string | null;
  setToast: (message: string | null) => void;
  refresh: () => Promise<void>;
  saveNew: (payload: TaskWrite) => Promise<Task>;
  saveExisting: (id: string, payload: TaskWrite) => Promise<Task>;
  moveToColumn: (id: string, to: "todo" | "doing" | "done") => Promise<void>;
  archiveTask: (id: string) => Promise<void>;
  addType: (name: string) => Promise<TaskType>;
  editType: (id: string, name: string) => Promise<void>;
  removeType: (id: string) => Promise<void>;
};

const TaskContext = createContext<TaskContextValue | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [board, setBoard] = useState<Task[]>([]);
  const [scheduled, setScheduled] = useState<Task[]>([]);
  const [archive, setArchive] = useState<Task[]>([]);
  const [types, setTypes] = useState<TaskType[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [nextBoard, nextScheduled, nextArchive, nextTypes] = await Promise.all([
      listTasks("board"),
      listTasks("scheduled"),
      listTasks("archive"),
      listTypes(),
    ]);
    setBoard(nextBoard);
    setScheduled(nextScheduled);
    setArchive(nextArchive);
    setTypes(nextTypes);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const saveNew = useCallback(async (payload: TaskWrite) => {
    const task = await createTask(payload);
    await refresh();
    return task;
  }, [refresh]);

  const saveExisting = useCallback(
    async (id: string, payload: TaskWrite) => {
      const task = await updateTask(id, payload);
      await refresh();
      return task;
    },
    [refresh],
  );

  const moveToColumn = useCallback(
    async (id: string, to: "todo" | "doing" | "done") => {
      await moveTask(id, to);
      await refresh();
    },
    [refresh],
  );

  const archiveTask = useCallback(
    async (id: string) => {
      await archiveNow(id);
      await refresh();
    },
    [refresh],
  );

  const addType = useCallback(async (name: string) => {
    const created = await createType(name);
    await refresh();
    return created;
  }, [refresh]);

  const editType = useCallback(
    async (id: string, name: string) => {
      await renameType(id, name);
      await refresh();
    },
    [refresh],
  );

  const removeType = useCallback(
    async (id: string) => {
      await deleteType(id);
      await refresh();
    },
    [refresh],
  );

  const value = useMemo(
    () => ({
      board,
      scheduled,
      archive,
      types,
      toast,
      setToast,
      refresh,
      saveNew,
      saveExisting,
      moveToColumn,
      archiveTask,
      addType,
      editType,
      removeType,
    }),
    [
      board,
      scheduled,
      archive,
      types,
      toast,
      refresh,
      saveNew,
      saveExisting,
      moveToColumn,
      archiveTask,
      addType,
      editType,
      removeType,
    ],
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks() {
  const value = useContext(TaskContext);
  if (!value) {
    throw new Error("useTasks must be used within TaskProvider");
  }
  return value;
}
