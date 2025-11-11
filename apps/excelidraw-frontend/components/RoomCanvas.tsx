"use client";

import { WS_BACKEND, HTTP_BACKEND } from "@/config";
import { initDraw } from "@/draw";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Canvas } from "./Canvas";
import axios from "axios";

export function RoomCanvas({ roomId: roomSlug }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [actualRoomId, setActualRoomId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { token, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // First, fetch the actual room ID from the slug
  useEffect(() => {
    if (loading || !isAuthenticated) return;

    const fetchRoomId = async () => {
      try {
        console.log("Fetching room details for slug:", roomSlug);
        const response = await axios.get(`${HTTP_BACKEND}/room/${roomSlug}`);
        const roomId = response.data.room.id;
        console.log("Found room ID:", roomId);
        setActualRoomId(roomId);
      } catch (err) {
        console.error("Error fetching room:", err);
        setError("Room not found. Please check the room ID.");
      }
    };

    fetchRoomId();
  }, [roomSlug, loading, isAuthenticated]);

  // Then, connect to WebSocket once we have the actual room ID
  useEffect(() => {
    console.log(
      "useEffect running - loading:",
      loading,
      "isAuthenticated:",
      isAuthenticated,
      "actualRoomId:",
      actualRoomId
    );

    // Wait for auth to finish loading
    if (loading) {
      console.log("Still loading auth, waiting...");
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated || !token) {
      console.log("User not authenticated, redirecting to signin");
      router.push("/signin");
      return;
    }

    // Wait for actual room ID to be fetched
    if (!actualRoomId) {
      console.log("Waiting for room ID to be fetched...");
      return;
    }

    console.log("Creating WebSocket connection with token to:", WS_BACKEND);
    const ws = new WebSocket(`${WS_BACKEND}?token=${token}`);

    ws.onopen = () => {
      console.log("WebSocket connected successfully");
      setSocket(ws);
      const data = JSON.stringify({
        type: "join_room",
        roomId: actualRoomId.toString(),
      });
      console.log("Sending join_room message:", data);
      ws.send(data);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = (event) => {
      console.log("WebSocket connection closed", event.code, event.reason);
    };

    return () => {
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        console.log("Closing WebSocket connection");
        ws.close();
      }
    };
  }, [actualRoomId, token, isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="text-xl">Loading authentication...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="text-xl">Redirecting to signin...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-500">{error}</div>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  if (!actualRoomId) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="text-xl">Loading room...</div>
      </div>
    );
  }

  if (!socket) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="text-xl">Connecting to server....</div>
      </div>
    );
  }

  return (
    <div>
      <Canvas roomId={actualRoomId.toString()} socket={socket} />
    </div>
  );
}
