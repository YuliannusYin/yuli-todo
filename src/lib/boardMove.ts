import { useCallback, useState } from "react";
import type { BoardColumn } from "./types";

export type PendingDoneMove = {
  id: string;
  from: BoardColumn;
};

export function needsDoneConfirm(from: BoardColumn, to: BoardColumn) {
  return to === "done" && from !== "done";
}

export function useBoardMove(moveTask: (id: string, to: BoardColumn) => Promise<unknown>) {
  const [pendingDone, setPendingDone] = useState<PendingDoneMove | null>(null);

  const onDrop = useCallback(
    async (id: string, from: BoardColumn, to: BoardColumn) => {
      if (from === to) {
        return;
      }
      if (needsDoneConfirm(from, to)) {
        setPendingDone({ id, from });
        return;
      }
      await moveTask(id, to);
    },
    [moveTask],
  );

  const confirmDone = useCallback(async () => {
    if (!pendingDone) {
      return;
    }
    const { id } = pendingDone;
    setPendingDone(null);
    await moveTask(id, "done");
  }, [moveTask, pendingDone]);

  const cancelDone = useCallback(() => {
    setPendingDone(null);
  }, []);

  return { pendingDone, onDrop, confirmDone, cancelDone };
}
