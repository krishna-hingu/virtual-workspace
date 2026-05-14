import { useEffect } from "react";
import { useWorkspaceStore } from "../store/workspaceStore";
import { taskAPI } from "../services/api";

export const useTaskHydration = () => {
  const tasks = useWorkspaceStore((state) => state.tasks);

  useEffect(() => {
    const hydrateTasks = async () => {
      if (tasks.length > 0) return;

      try {
        console.log("📦 Analytics hydration: loading tasks");

        const res = await taskAPI.getTasks();

        useWorkspaceStore.setState({
          tasks: res.data || [],
        });

        console.log(
          "✅ Analytics hydration complete:",
          res.data?.length || 0,
          "tasks"
        );
      } catch (err) {
        console.error("❌ Task hydration failed:", err);
      }
    };

    hydrateTasks();
  }, [tasks.length]);
};
