"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { useAuthenticator } from "@aws-amplify/ui-react";
import WebSocketClient from "./components/WebSocketClient";

const client = generateClient<Schema>();

export default function App() {
  const [episodes, setEpisodes] = useState<
    Array<Schema["CurrentEpisodes"]["type"]>
  >([]);

  const { signOut } = useAuthenticator();

  function listEpisodes() {
    client.models.CurrentEpisodes.observeQuery().subscribe({
      next: (data) => setEpisodes([...data.items]),
    });
  }

  useEffect(() => {
    listEpisodes();
  }, []);

  return (
    <main>
      <h1>Current Episodes</h1>
      <ul>
        {episodes.map((episode) => (
          <li key={episode.id}>{episode.title}</li>
        ))}
      </ul>
      <button onClick={signOut}>Sign Out</button>
      <WebSocketClient />
    </main>
  );
}
