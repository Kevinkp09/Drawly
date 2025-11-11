"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function Navbar() {
  const { isAuthenticated, signout } = useAuth();
  const router = useRouter();

  const handleSignout = () => {
    signout();
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gray-800">
          Excalidraw Clone
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Home
              </Link>
              <button
                onClick={handleSignout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
