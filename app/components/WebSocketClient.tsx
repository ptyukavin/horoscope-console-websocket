// app/components/WebSocketClient.tsx
"use client";

import { useEffect, useState } from "react";

export default function WebSocketClient() {
  const [messages, setMessages] = useState<any[]>([]);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [newEpisodeTitle, setNewEpisodeTitle] = useState<string>("");
  const [newEpisodeId, setNewEpisodeId] = useState<string>("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let websocket: WebSocket | null = null;

    // Replace with your SAM WebSocket endpoint
    const websocketUrl =
      "wss://qi45jx1pr1.execute-api.eu-central-1.amazonaws.com/prod";

    console.log("Connecting to:", websocketUrl);
    websocket = new WebSocket(websocketUrl);

    websocket.onopen = () => {
      console.log("WebSocket connected");
      setWs(websocket);
      setError("");
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      // message is an object with list of episodes and an object newEpisode with id and title
      if (message.episodes) {
        setEpisodes(message.episodes);
      }
      if (message.newEpisode) {
        setNewEpisodeId(message.newEpisode.id);
        setNewEpisodeTitle(message.newEpisode.title);
      }

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

    return () => {
      if (websocket) {
        console.log("Cleaning up WebSocket connection");
        websocket.close();
      }
    };
  }, []);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h2>Real-time Updates (WebSocket)</h2>
      <div>Status: {ws ? "Connected" : "Disconnected"}</div>
      {error && <div style={{ color: "red" }}>Error: {error}</div>}
      <div>
        {episodes.map((episode, i) => (
          <div
            key={i}
            style={{
              border: "1px solid #ccc",
              margin: "10px 0",
              padding: "10px",
              borderRadius: "8px",
            }}
          >
            <h3>{episode.title} Event</h3>
            <p>
              <strong>ID:</strong> {episode.id}
            </p>
            <p>
              <strong>Title:</strong> {episode.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
