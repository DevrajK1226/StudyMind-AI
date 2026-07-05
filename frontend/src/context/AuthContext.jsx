import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((data) => setUser(data))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem("token", data.token);
    setUser(data.user);
  };

  const register = async (name, email, password) => {
    // Does NOT log the user in — account is unverified until they enter the code
    const data = await api.register(name, email, password);
    return data; // { message, email }
  };

  const verifyEmail = async (email, code) => {
    const data = await api.verifyEmail(email, code);
    localStorage.setItem("token", data.token);
    setUser(data.user);
  };

  const resendCode = async (email) => {
    return api.resendCode(email);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, verifyEmail, resendCode, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
