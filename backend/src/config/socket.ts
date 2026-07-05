import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

export class SocketHub {
  private static io: Server | null = null;

  /**
   * Initializes the global Socket.io engine bound to your Express Http server instance
   */
  public static init(server: HttpServer): Server {
    this.io = new Server(server, {
      cors: {
        origin: "http://localhost:3000", // Trust your frontend Next.js app port configuration
        credentials: true,
        methods: ["GET", "POST"]
      }
    });

    console.log("⚡ Real-time Socket.io engine instance prepared.");

    // Coordinate state attachments for active client listeners
    this.io.on("connection", (socket: Socket) => {
      console.log(`🔌 Client attached to network socket pipeline: ${socket.id}`);

      // Hook: Triggered when a developer clicks into a live contest workspace arena
      socket.on("join_contest", (contestPublicId: string) => {
        socket.join(contestPublicId);
        console.log(`📡 Socket client [${socket.id}] entered contest room lane: [${contestPublicId}]`);
      });

      // Hook: Triggered when a developer navigates away from the contest window
      socket.on("leave_contest", (contestPublicId: string) => {
        socket.leave(contestPublicId);
        console.log(`🚪 Socket client [${socket.id}] exited contest room lane: [${contestPublicId}]`);
      });

      socket.on("disconnect", () => {
        console.log(`🔌 Client detached from socket interface: ${socket.id}`);
      });
    });

    return this.io;
  }

  /**
   * Broadcasts a payload out to every active participant locked inside a specific contest room
   */
  public static emitToContest(contestPublicId: string, event: string, payload: any): void {
    if (!this.io) {
      console.warn("⚠️ Cannot emit real-time updates: Socket server not yet instantiated.");
      return;
    }
    // Fires the packet only to browsers active inside the targeted room container line
    this.io.to(contestPublicId).emit(event, payload);
  }
}