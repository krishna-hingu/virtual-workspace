import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/authStore";
import { authAPI } from "../services/api";

export const useAuth = () => {
  const { user, token, isLoading, error, isInitialized, fetchMe } = useAuthStore();
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!isInitialized && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      fetchMe();
    }
  }, [isInitialized]); // Remove fetchMe from dependencies to prevent infinite loop

  return {
    user,
    token,
    isLoading,
    error,
    isInitialized,
    isAuthenticated: !!token || !!localStorage.getItem("token"),
  };
};
