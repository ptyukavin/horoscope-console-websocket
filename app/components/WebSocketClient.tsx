// app/components/WebSocketClient.tsx
"use client";

import { useEffect, useState } from "react";
import outputs from "@/amplify_outputs.json";

export default function WebSocketClient() {
  const [messages, setMessages] = useState<any[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const websocketUrl = (outputs as any).custom?.websocketEndpoint;
    if (!websocketUrl) {
      console.error("WebSocket endpoint not found in outputs");
      return;
    }

    console.log("Connecting to:", websocketUrl);
    const websocket = new WebSocket(websocketUrl);

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
    };

    websocket.onerror = (event) => {
      console.error("WebSocket error:", event);
      setError("Connection error");
    };

    return () => websocket.close();
  }, []);

  return (
    <div>
      <h2>Real-time Updates</h2>
      <div>Status: {ws ? "Connected" : "Disconnected"}</div>
      {error && <div style={{ color: "red" }}>Error: {error}</div>}
      <ul>
        {messages.map((msg, i) => (
          <li key={i}>
            {msg.eventName}: {JSON.stringify(msg.data)}
          </li>
        ))}
      </ul>
    </div>
  );
}
