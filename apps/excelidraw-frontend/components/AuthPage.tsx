"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

//! Ideally you should have the input boxes as separate. In packages/ui you can have it.
export function AuthPage({ isSignin }: { isSignin: boolean }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signin, signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      if (isSignin) {
        await signin(username, password);
        router.push("/");
      } else {
        if (!name) {
          setError("Name is required");
          setLoading(false);
          return;
        }
        await signup(username, password, name);
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="p-6 m-2 bg-white rounded shadow-lg min-w-[300px]">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
          {isSignin ? "Sign In" : "Sign Up"}
        </h2>

        {!isSignin && (
          <div className="p-2">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800"
            />
          </div>
        )}

        <div className="p-2">
          <input
            type="text"
            placeholder="Username/Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800"
          />
        </div>

        <div className="p-2">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800"
          />
        </div>

        {error && (
          <div className="p-2 text-red-500 text-sm text-center">{error}</div>
        )}

        <div className="pt-2 p-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded"
          >
            {loading ? "Loading..." : isSignin ? "Sign In" : "Sign Up"}
          </button>
        </div>

        <div className="p-2 text-center text-sm text-gray-600">
          {isSignin ? (
            <p>
              Don't have an account?{" "}
              <a href="/signup" className="text-blue-500 hover:underline">
                Sign Up
              </a>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <a href="/signin" className="text-blue-500 hover:underline">
                Sign In
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
