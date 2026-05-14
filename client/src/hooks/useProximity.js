import { useEffect } from "react";
import { useWorkspaceStore } from "../store/workspaceStore";
import { useSocketEvent } from "./useSocket";

export const useProximity = () => {
  const { nearbyUsers, addNearbyUser, removeNearbyUser } = useWorkspaceStore();

  useSocketEvent("proximity:enter", (data) => {
    addNearbyUser(data.user);
  });

  useSocketEvent("proximity:exit", (data) => {
    removeNearbyUser(data.userId);
  });

  return {
    nearbyUsers,
  };
};
