import { Server, Socket } from "socket.io";
import { MockInterviewService } from "../services/mock-interview.service";

export function registerInterviewSocketHandlers(io: Server, socket: Socket) {
  /**
   * Candidate joins an active interview room
   */
  socket.on("interview:join", async (data: { interviewId: string; candidateName?: string }) => {
    try {
      const roomKey = `interview:${data.interviewId}`;
      socket.join(roomKey);
      console.log(`🎙️ Socket [${socket.id}] joined interview room: [${roomKey}]`);

      const session = await MockInterviewService.getInterview(data.interviewId);
      if (session) {
        socket.emit("interview:joined", {
          success: true,
          session
        });
      } else {
        socket.emit("interview:error", { message: "Interview session not found." });
      }
    } catch (err: any) {
      console.error("Error joining interview room:", err);
      socket.emit("interview:error", { message: err?.message || "Failed to join interview" });
    }
  });

  /**
   * Candidate speech / chat message turn
   */
  socket.on(
    "interview:candidate_message",
    async (data: {
      interviewId: string;
      text: string;
      code?: string;
      language?: string;
      screenObservation?: string;
    }) => {
      const roomKey = `interview:${data.interviewId}`;
      try {
        // Broadcast that interviewer is analyzing
        io.to(roomKey).emit("interview:interviewer_status", {
          status: "thinking",
          interviewerName: "Interviewer"
        });

        const turnResult = await MockInterviewService.processTurn({
          interviewId: data.interviewId,
          userSpeech: data.text,
          currentCode: data.code,
          language: data.language,
          contextType: "speech",
          screenObservation: data.screenObservation
        });

        // Broadcast interviewer response
        io.to(roomKey).emit("interview:interviewer_status", {
          status: "speaking"
        });

        io.to(roomKey).emit("interview:interviewer_message", {
          text: turnResult.interviewerReply,
          isHint: turnResult.isHint,
          codeCritique: turnResult.codeCritique,
          updatedTranscript: turnResult.updatedTranscript
        });

        // Transition back to idle after speech animation duration
        setTimeout(() => {
          io.to(roomKey).emit("interview:interviewer_status", {
            status: "idle"
          });
        }, 3500);
      } catch (err: any) {
        console.error("Error processing interview message turn:", err);
        io.to(roomKey).emit("interview:interviewer_status", { status: "idle" });
        socket.emit("interview:error", { message: err?.message || "Failed to process turn" });
      }
    }
  );

  /**
   * Candidate explicitly requests a hint
   */
  socket.on(
    "interview:request_hint",
    async (data: { interviewId: string; code?: string; language?: string }) => {
      const roomKey = `interview:${data.interviewId}`;
      try {
        io.to(roomKey).emit("interview:interviewer_status", { status: "thinking" });

        const turnResult = await MockInterviewService.processTurn({
          interviewId: data.interviewId,
          currentCode: data.code,
          language: data.language,
          contextType: "hint_request"
        });

        io.to(roomKey).emit("interview:interviewer_status", { status: "speaking" });

        io.to(roomKey).emit("interview:interviewer_message", {
          text: turnResult.interviewerReply,
          isHint: true,
          updatedTranscript: turnResult.updatedTranscript
        });

        setTimeout(() => {
          io.to(roomKey).emit("interview:interviewer_status", { status: "idle" });
        }, 3500);
      } catch (err: any) {
        console.error("Error processing hint request:", err);
        io.to(roomKey).emit("interview:interviewer_status", { status: "idle" });
      }
    }
  );

  /**
   * Candidate asks for live code inspection
   */
  socket.on(
    "interview:request_code_review",
    async (data: { interviewId: string; code: string; language: string }) => {
      const roomKey = `interview:${data.interviewId}`;
      try {
        io.to(roomKey).emit("interview:interviewer_status", { status: "thinking" });

        const turnResult = await MockInterviewService.processTurn({
          interviewId: data.interviewId,
          currentCode: data.code,
          language: data.language,
          contextType: "code_review"
        });

        io.to(roomKey).emit("interview:interviewer_status", { status: "speaking" });

        io.to(roomKey).emit("interview:interviewer_message", {
          text: turnResult.interviewerReply,
          codeCritique: turnResult.codeCritique,
          updatedTranscript: turnResult.updatedTranscript
        });

        setTimeout(() => {
          io.to(roomKey).emit("interview:interviewer_status", { status: "idle" });
        }, 3500);
      } catch (err: any) {
        console.error("Error processing code review request:", err);
        io.to(roomKey).emit("interview:interviewer_status", { status: "idle" });
      }
    }
  );

  /**
   * Candidate executed test cases inside the IDE
   */
  socket.on(
    "interview:test_run_result",
    async (data: {
      interviewId: string;
      passed: number;
      total: number;
      error?: string;
      code?: string;
      language?: string;
    }) => {
      const roomKey = `interview:${data.interviewId}`;
      try {
        io.to(roomKey).emit("interview:interviewer_status", { status: "thinking" });

        const turnResult = await MockInterviewService.processTurn({
          interviewId: data.interviewId,
          currentCode: data.code,
          language: data.language,
          contextType: "test_run",
          testResults: {
            passed: data.passed,
            total: data.total,
            error: data.error
          }
        });

        io.to(roomKey).emit("interview:interviewer_status", { status: "speaking" });

        io.to(roomKey).emit("interview:interviewer_message", {
          text: turnResult.interviewerReply,
          updatedTranscript: turnResult.updatedTranscript
        });

        setTimeout(() => {
          io.to(roomKey).emit("interview:interviewer_status", { status: "idle" });
        }, 3500);
      } catch (err: any) {
        console.error("Error handling test run in interview:", err);
        io.to(roomKey).emit("interview:interviewer_status", { status: "idle" });
      }
    }
  );

  /**
   * Live debounced code update
   */
  socket.on(
    "interview:code_update",
    async (data: { interviewId: string; code: string; language: string }) => {
      // Broadcast to any observers or update session state
      const roomKey = `interview:${data.interviewId}`;
      socket.to(roomKey).emit("interview:code_updated", {
        code: data.code,
        language: data.language
      });
    }
  );

  /**
   * Candidate speaking indicator
   */
  socket.on(
    "interview:user_speaking",
    (data: { interviewId: string; isSpeaking: boolean }) => {
      const roomKey = `interview:${data.interviewId}`;
      socket.to(roomKey).emit("interview:user_speaking_state", {
        isSpeaking: data.isSpeaking
      });
    }
  );

  /**
   * End interview and produce final FAANG evaluation scorecard
   */
  socket.on(
    "interview:end_session",
    async (data: {
      interviewId: string;
      finalCode?: string;
      language?: string;
      telemetry?: any;
    }) => {
      const roomKey = `interview:${data.interviewId}`;
      try {
        io.to(roomKey).emit("interview:status_update", {
          status: "EVALUATING",
          message: "The Hiring Committee is analyzing your interview session, code, and communication..."
        });

        const scorecard = await MockInterviewService.finalizeInterview({
          interviewId: data.interviewId,
          finalCode: data.finalCode,
          language: data.language,
          telemetry: data.telemetry
        });

        io.to(roomKey).emit("interview:completed", {
          success: true,
          scorecard
        });
      } catch (err: any) {
        console.error("Error finalizing interview session:", err);
        socket.emit("interview:error", { message: err?.message || "Failed to finalize interview" });
      }
    }
  );
}
