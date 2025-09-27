import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import { Circle, Pencil, RectangleHorizontalIcon } from "lucide-react";
import { Game } from "@/draw/Game";

export type Tool = "circle" | "rect" | "pencil";

export function Canvas({
  roomId,
  socket,
}: {
  socket: WebSocket;
  roomId: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<Game>();
  const [selectedTool, setSelectedTool] = useState<Tool>("circle");
  const [cameraState, setCameraState] = useState({ x: 0, y: 0, zoom: 1 });

  useEffect(() => {
    game?.setTool(selectedTool);
  }, [selectedTool, game]);

  useEffect(() => {
    if (canvasRef.current) {
      const g = new Game(canvasRef.current, roomId, socket);
      setGame(g);

      const interval = setInterval(() => {
        if (g) {
          setCameraState(g.getCameraState());
        }
      }, 100);

      return () => {
        g.destroy();
        clearInterval(interval);
      };
    }
  }, [canvasRef]);

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "blue",
      }}
    >
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
      ></canvas>
      <Topbar setSelectedTool={setSelectedTool} selectedTool={selectedTool} />
      <ZoomIndicator cameraState={cameraState} />
    </div>
  );
}

function Topbar({
  selectedTool,
  setSelectedTool,
}: {
  selectedTool: Tool;
  setSelectedTool: (s: Tool) => void;
}) {
  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 10,
          left: 10,
        }}
      >
        <div className="flex gap-2">
          <IconButton
            onClick={() => {
              setSelectedTool("pencil");
            }}
            activated={selectedTool === "pencil"}
            icon={<Pencil />}
          />
          <IconButton
            onClick={() => {
              setSelectedTool("rect");
            }}
            activated={selectedTool === "rect"}
            icon={<RectangleHorizontalIcon />}
          ></IconButton>
          <IconButton
            onClick={() => {
              setSelectedTool("circle");
            }}
            activated={selectedTool === "circle"}
            icon={<Circle />}
          ></IconButton>
        </div>
      </div>

      {/* Instructions */}
      <div
        style={{
          position: "fixed",
          top: 10,
          right: 10,
          background: "rgba(0, 0, 0, 0.8)",
          color: "white",
          padding: "10px",
          borderRadius: "5px",
          fontSize: "12px",
          maxWidth: "250px",
        }}
      >
        <div>
          <strong>Controls:</strong>
        </div>
        <div>• Scroll to zoom in/out</div>
        <div>• Ctrl/Cmd + Click to pan</div>
        <div>• Middle mouse button to pan</div>
        <div>• Press 'R' to reset view</div>
        <div>• '+/-' keys to zoom</div>
      </div>
    </>
  );
}

function ZoomIndicator({
  cameraState,
}: {
  cameraState: { x: number; y: number; zoom: number };
}) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: 20,
        background: "rgba(0, 0, 0, 0.8)",
        color: "white",
        padding: "8px 12px",
        borderRadius: "5px",
        fontSize: "12px",
        fontFamily: "monospace",
      }}
    >
      Zoom: {Math.round(cameraState.zoom * 100)}%
    </div>
  );
}
