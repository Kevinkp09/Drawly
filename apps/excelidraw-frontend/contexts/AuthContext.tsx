"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";
import { HTTP_BACKEND } from "@/config";

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  signin: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, name: string) => Promise<void>;
  signout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load token from localStorage on mount
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

  const signin = async (username: string, password: string) => {
    const response = await axios.post(`${HTTP_BACKEND}/signin`, {
      username,
      password,
    });
    const newToken = response.data.token;
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const signup = async (username: string, password: string, name: string) => {
    await axios.post(`${HTTP_BACKEND}/signup`, {
      username,
      password,
      name,
    });
    // After signup, automatically sign in
    await signin(username, password);
  };

  const signout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        signin,
        signup,
        signout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
