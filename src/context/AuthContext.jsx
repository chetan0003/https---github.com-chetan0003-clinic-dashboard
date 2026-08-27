import React, { createContext, useContext, useMemo, useState } from "react";
import { login as loginApi } from "../services/api";

const AuthContext = createContext(null);

function extractToken(data) {
  if (!data) return null;
  return (
    data.token ||
    data.accessToken ||
    data.jwt ||
    data.access_token ||
    data?.data?.token ||
    data?.data?.accessToken ||
    null
  );
}

function extractUser(data, username) {
  return (
    data?.user ||
    data?.data?.user ||
    {
      username: data?.username || username,
      firstName: data?.firstName,
      lastName: data?.lastName,
      role: data?.role || data?.roles?.[0],
      clinicId: data?.clinicId,
    }
  );
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("clinicflow_token"));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("clinicflow_user")) || null;
    } catch {
      return null;
    }
  });

  async function login(username, password) {
    const data = await loginApi(username, password);
    const newToken = extractToken(data);

    if (!newToken) {
      throw new Error(
        "Login succeeded but no token was found in the response. Please check the login API response format."
      );
    }

    const newUser = extractUser(data, username);
    localStorage.setItem("clinicflow_token", newToken);
    localStorage.setItem("clinicflow_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);

    return data;
  }

  function logout() {
    localStorage.removeItem("clinicflow_token");
    localStorage.removeItem("clinicflow_user");
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
