// app/components/WebSocketClient.tsx
"use client";

import { useEffect, useState } from "react";

export default function WebSocketClient() {
  const [messages, setMessages] = useState<any[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let websocket: WebSocket | null = null;

    // Import outputs dynamically to avoid build issues
    import("@/amplify_outputs.json").then((outputs) => {
      const websocketUrl = (outputs as any).custom?.websocketEndpoint;
      if (!websocketUrl) {
        console.error("WebSocket endpoint not found in outputs");
        return;
      }

      console.log("Connecting to:", websocketUrl);
      websocket = new WebSocket(websocketUrl);

      websocket.onopen = () => {
        console.log("WebSocket connected");
        setWs(websocket);
        setError("");
      };

      websocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log("Received:", message);
        setMessages((prev) => [...prev, message]);
      };

      websocket.onclose = (event) => {
        console.log("WebSocket disconnected", event.code, event.reason);
        setError(`Disconnected: ${event.code} ${event.reason}`);
        setWs(null);
      };

      websocket.onerror = (event) => {
        console.error("WebSocket error:", event);
        setError("Connection error");
      };
    });

    // Cleanup function
    return () => {
      if (websocket) {
        console.log("Cleaning up WebSocket connection");
        websocket.close();
      }
    };
  }, []); // Empty dependency array

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h2>Real-time Updates (WebSocket)</h2>
      <div>Status: {ws ? "Connected" : "Disconnected"}</div>
      {error && <div style={{ color: "red" }}>Error: {error}</div>}
      <div>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              border: "1px solid #ccc",
              margin: "10px 0",
              padding: "10px",
              borderRadius: "8px",
            }}
          >
            <h3>{msg.eventName} Event</h3>
            <p>
              <strong>ID:</strong> {msg.data?.id?.S}
            </p>
            <p>
              <strong>Title:</strong> {msg.data?.title?.S}
            </p>
            <p>
              <strong>Description:</strong> {msg.data?.description?.S}
            </p>
            <p>
              <small>Time: {msg.timestamp}</small>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
