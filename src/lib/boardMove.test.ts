import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useBoardMove } from "./boardMove";

describe("useBoardMove", () => {
  it("does not call move_task when Done confirmation is cancelled", async () => {
    const moveTask = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useBoardMove(moveTask));

    await act(async () => {
      await result.current.onDrop("task-1", "todo", "done");
    });
    expect(moveTask).not.toHaveBeenCalled();

    act(() => {
      result.current.cancelDone();
    });
    expect(moveTask).not.toHaveBeenCalled();
  });

  it("calls move_task after Done confirmation", async () => {
    const moveTask = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useBoardMove(moveTask));

    await act(async () => {
      await result.current.onDrop("task-1", "todo", "done");
    });
    await act(async () => {
      await result.current.confirmDone();
    });
    expect(moveTask).toHaveBeenCalledTimes(1);
    expect(moveTask).toHaveBeenCalledWith("task-1", "done");
  });
});
