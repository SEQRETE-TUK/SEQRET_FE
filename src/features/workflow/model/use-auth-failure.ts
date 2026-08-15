import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { ApiError } from "@/api/client";
import { useAuth } from "@/features/auth/model/auth-context";

export function useAuthFailure(...errors: unknown[]) {
  const { clearSession } = useAuth();
  const navigate = useNavigate();
  const unauthorized = errors.some((error) => error instanceof ApiError && error.status === 401);

  useEffect(() => {
    if (unauthorized) {
      clearSession();
      navigate("/", { replace: true });
    }
  }, [clearSession, navigate, unauthorized]);
}
