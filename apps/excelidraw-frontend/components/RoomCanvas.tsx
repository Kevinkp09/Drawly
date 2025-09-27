"use client";

import { WS_BACKEND } from "@/config";
import { initDraw } from "@/draw";
import { useEffect, useRef, useState } from "react";
import { Canvas } from "./Canvas";

export function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(
      `${WS_BACKEND}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlN2RjMTk5YS1jNWZiLTRhZjQtOTE5MC1mZmI0YWY3N2MzNGIiLCJpYXQiOjE3NTg5OTE2MDF9.wXRCTFMeDkZBQDiTHcopvOnr6DGV1bssmViuMC9bIY8`
    );

    ws.onopen = () => {
      setSocket(ws);
      const data = JSON.stringify({
        type: "join_room",
        roomId,
      });
      console.log(data);
      ws.send(data);
    };
  }, []);

  if (!socket) {
    return <div>Connecting to server....</div>;
  }

  return (
    <div>
      <Canvas roomId={roomId} socket={socket} />
    </div>
  );
}
