const API_BASE_URL = "https://chat.shellkode.ai";

const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};



export class ApiService {
  static currentRequestId = null;

  static async sendMessage(request) {
    const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  static async sendMessageStream(request, callbacks) {
    console.log("Sending streaming request:", request);
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/message/stream`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body reader available");
      }

      const decoder = new TextDecoder();
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case "start":
                  this.currentRequestId = data.request_id;
                  callbacks.onStart?.(data.message_id, data.request_id);
                  break;
                case "content":
                  accumulatedContent += data.content || "";
                  callbacks.onContent?.(data.content, accumulatedContent);
                  break;
                case "mode_suggestion":
                  callbacks.onModeSuggestion?.(data.data);
                  break;
                case "end":
                  callbacks.onEnd?.(accumulatedContent, data.message_id);
                  return;
                case "error":
                  callbacks.onError?.(data.error);
                  return;
                case "stopped":
                  callbacks.onStopped?.(data.message);
                  return;
                case "done":
                  callbacks.onDone?.();
                  return;
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      callbacks.onError?.(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  static async rerunMessageWithModeStream(content, mode, sessionId, callbacks) {
    return this.sendMessageStream(
      {
        content,
        mode: mode,
        session_id: sessionId,
      },
      callbacks
    );
  }

  static async createSession() {
    const response = await fetch(`${API_BASE_URL}/api/chat/sessions`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  static async getUserSessions() {
    const response = await fetch(`${API_BASE_URL}/api/chat/sessions`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  static async getSessionMessages(sessionId) {
    const response = await fetch(`${API_BASE_URL}/api/chat/sessions/${sessionId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  static async deleteSession(sessionId) {
    const response = await fetch(`${API_BASE_URL}/api/chat/sessions/${sessionId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  static async stopStreaming(requestId = null) {
    const id = requestId || this.currentRequestId;
    if (!id) {
      throw new Error("No request ID available for stopping");
    }
    
    const response = await fetch(`${API_BASE_URL}/api/chat/stop/${id}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }
}
