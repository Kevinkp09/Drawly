import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";

type Shape =
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "circle";
      centerX: number;
      centerY: number;
      radius: number;
    }
  | {
      type: "pencil";
      points: { x: number; y: number }[];
    };

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private existingShapes: Shape[];
  private roomId: string;
  private clicked: boolean;
  private startX = 0;
  private startY = 0;
  private selectedTool: Tool = "circle";
  private pencilPoints: { x: number; y: number }[] = [];

  // Camera/Viewport properties for zoom and pan
  private camera = {
    x: 0,
    y: 0,
    zoom: 1,
  };
  private isPanning = false;
  private panStartX = 0;
  private panStartY = 0;
  private lastCameraX = 0;
  private lastCameraY = 0;

  socket: WebSocket;

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.existingShapes = [];
    this.roomId = roomId;
    this.socket = socket;
    this.clicked = false;
    this.init();
    this.initHandlers();
    this.initMouseHandlers();
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.removeEventListener("wheel", this.wheelHandler);
    document.removeEventListener("keydown", this.keyHandler);
  }

  setTool(tool: "circle" | "pencil" | "rect") {
    this.selectedTool = tool;
  }

  // Get current camera state (useful for UI display)
  getCameraState() {
    return {
      x: this.camera.x,
      y: this.camera.y,
      zoom: this.camera.zoom,
    };
  }

  // Convert screen coordinates to world coordinates
  private screenToWorld(screenX: number, screenY: number) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (screenX - rect.left - this.camera.x) / this.camera.zoom;
    const y = (screenY - rect.top - this.camera.y) / this.camera.zoom;
    return { x, y };
  }

  // Convert world coordinates to screen coordinates
  private worldToScreen(worldX: number, worldY: number) {
    const x = worldX * this.camera.zoom + this.camera.x;
    const y = worldY * this.camera.zoom + this.camera.y;
    return { x, y };
  }

  // Apply camera transformation to the canvas context
  private applyCamera() {
    this.ctx.setTransform(
      this.camera.zoom,
      0,
      0,
      this.camera.zoom,
      this.camera.x,
      this.camera.y
    );
  }

  // Reset camera transformation
  private resetCamera() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  async init() {
    this.existingShapes = await getExistingShapes(this.roomId);
    console.log(this.existingShapes);
    this.clearCanvas();
  }

  initHandlers() {
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type == "chat") {
        const parsedShape = JSON.parse(message.message);
        this.existingShapes?.push(parsedShape.shape);
        this.clearCanvas();
      }
    };
  }

  clearCanvas() {
    // Reset transformation to clear the entire canvas
    this.resetCamera();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "rgba(0, 0, 0)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply camera transformation for drawing shapes
    this.applyCamera();

    this.existingShapes?.map((shape) => {
      if (shape.type === "rect") {
        this.ctx.strokeStyle = "rgba(255, 255, 255)";
        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      } else if (shape.type === "circle") {
        console.log(shape);
        this.ctx.beginPath();
        this.ctx.arc(
          shape.centerX,
          shape.centerY,
          Math.abs(shape.radius),
          0,
          Math.PI * 2
        );
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (shape.type === "pencil") {
        console.log(shape);
        console.log(shape.points);
        this.ctx.strokeStyle = "rgba(255, 255, 255)";
        this.ctx.beginPath();
        for (let i = 1; i < shape.points.length; i++) {
          const prev = shape.points[i - 1];
          const curr = shape.points[i];
          this.ctx.moveTo(prev.x, prev.y);
          this.ctx.lineTo(curr.x, curr.y);
        }
        this.ctx.stroke();
        this.ctx.closePath();
      }
    });
  }

  mouseDownHandler = (e: MouseEvent) => {
    // Check for middle mouse button or space+left click for panning
    if (
      e.button === 1 ||
      (e.button === 0 && e.ctrlKey) ||
      (e.button === 0 && e.metaKey)
    ) {
      this.isPanning = true;
      this.panStartX = e.clientX;
      this.panStartY = e.clientY;
      this.lastCameraX = this.camera.x;
      this.lastCameraY = this.camera.y;
      e.preventDefault();
      return;
    }

    // Drawing functionality
    if (e.button === 0) {
      // Left mouse button
      this.clicked = true;
      const worldCoords = this.screenToWorld(e.clientX, e.clientY);
      this.startX = worldCoords.x;
      this.startY = worldCoords.y;

      if (this.selectedTool === "pencil") {
        this.pencilPoints = [{ x: worldCoords.x, y: worldCoords.y }];
      }
    }
  };

  mouseUpHandler = (e: MouseEvent) => {
    if (this.isPanning) {
      this.isPanning = false;
      return;
    }

    if (!this.clicked) return;

    this.clicked = false;
    const worldCoords = this.screenToWorld(e.clientX, e.clientY);
    const width = worldCoords.x - this.startX;
    const height = worldCoords.y - this.startY;

    const selectedTool = this.selectedTool;
    let shape: Shape | null = null;
    if (!this.existingShapes) {
      this.existingShapes = [];
    }
    if (selectedTool === "rect") {
      shape = {
        type: "rect",
        x: this.startX,
        y: this.startY,
        height,
        width,
      };
    } else if (selectedTool === "circle") {
      const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
      shape = {
        type: "circle",
        radius: radius,
        centerX: this.startX + width / 2,
        centerY: this.startY + height / 2,
      };
    } else if (selectedTool === "pencil") {
      shape = {
        type: "pencil",
        points: this.pencilPoints,
      };
      this.pencilPoints = [];
    }

    if (!shape) {
      return;
    }

    this.existingShapes.push(shape);

    this.socket.send(
      JSON.stringify({
        type: "chat",
        message: JSON.stringify({
          shape,
        }),
        roomId: this.roomId,
      })
    );
  };

  mouseMoveHandler = (e: MouseEvent) => {
    if (this.isPanning) {
      const deltaX = e.clientX - this.panStartX;
      const deltaY = e.clientY - this.panStartY;
      this.camera.x = this.lastCameraX + deltaX;
      this.camera.y = this.lastCameraY + deltaY;
      this.clearCanvas();
      return;
    }

    if (this.clicked) {
      const worldCoords = this.screenToWorld(e.clientX, e.clientY);
      const width = worldCoords.x - this.startX;
      const height = worldCoords.y - this.startY;

      this.clearCanvas();
      this.ctx.strokeStyle = "rgba(255, 255, 255)";

      const selectedTool = this.selectedTool;
      if (selectedTool === "rect") {
        this.ctx.strokeRect(this.startX, this.startY, width, height);
      } else if (selectedTool === "circle") {
        const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
        const centerX = this.startX + width / 2;
        const centerY = this.startY + height / 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (selectedTool === "pencil") {
        this.pencilPoints.push({ x: worldCoords.x, y: worldCoords.y });
        this.ctx.beginPath();
        for (let i = 1; i < this.pencilPoints.length; i++) {
          const prev = this.pencilPoints[i - 1];
          const curr = this.pencilPoints[i];
          this.ctx.moveTo(prev.x, prev.y);
          this.ctx.lineTo(curr.x, curr.y);
        }
        this.ctx.stroke();
        this.ctx.closePath();
      }
    }
  };

  wheelHandler = (e: WheelEvent) => {
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Get world coordinates before zoom
    const worldBefore = this.screenToWorld(e.clientX, e.clientY);

    // Zoom factor
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, this.camera.zoom * zoomFactor));

    // Update zoom
    this.camera.zoom = newZoom;

    // Get world coordinates after zoom
    const worldAfter = this.screenToWorld(e.clientX, e.clientY);

    // Adjust camera position to keep mouse position fixed
    this.camera.x += (worldAfter.x - worldBefore.x) * this.camera.zoom;
    this.camera.y += (worldAfter.y - worldBefore.y) * this.camera.zoom;

    this.clearCanvas();
  };

  keyHandler = (e: KeyboardEvent) => {
    // Reset zoom and pan with 'R' key
    if (e.key === "r" || e.key === "R") {
      this.camera.x = 0;
      this.camera.y = 0;
      this.camera.zoom = 1;
      this.clearCanvas();
    }

    // Zoom in with '+' or '='
    if (e.key === "+" || e.key === "=") {
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      const worldBefore = this.screenToWorld(centerX, centerY);
      this.camera.zoom = Math.min(5, this.camera.zoom * 1.1);
      const worldAfter = this.screenToWorld(centerX, centerY);
      this.camera.x += (worldAfter.x - worldBefore.x) * this.camera.zoom;
      this.camera.y += (worldAfter.y - worldBefore.y) * this.camera.zoom;
      this.clearCanvas();
    }

    // Zoom out with '-'
    if (e.key === "-") {
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      const worldBefore = this.screenToWorld(centerX, centerY);
      this.camera.zoom = Math.max(0.1, this.camera.zoom * 0.9);
      const worldAfter = this.screenToWorld(centerX, centerY);
      this.camera.x += (worldAfter.x - worldBefore.x) * this.camera.zoom;
      this.camera.y += (worldAfter.y - worldBefore.y) * this.camera.zoom;
      this.clearCanvas();
    }
  };

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.addEventListener("wheel", this.wheelHandler);

    // Add keyboard event listener
    document.addEventListener("keydown", this.keyHandler);

    // Prevent context menu on right click
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // Make canvas focusable for keyboard events
    this.canvas.tabIndex = 0;
  }
}
