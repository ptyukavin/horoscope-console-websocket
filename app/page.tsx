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

  useEffect(() => {
    const sub = client.models.CurrentEpisodes.observeQuery().subscribe({
      next: ({ items, isSynced }) => setEpisodes([...items]),
    });
    return () => {
      sub.unsubscribe();
    };
  }, []);

  return (
    <main>
      <h1>Current Episodes</h1>
      <ul>
        {episodes
          .filter((episode) => episode !== null && episode !== undefined)
          .map(
            (episode) => (
              console.log("EPISODE >> ", episode),
              (<li key={episode.id}>{episode.title}</li>)
            )
          )}
      </ul>

      <button onClick={signOut}>Sign Out</button>
      <WebSocketClient />
    </main>
  );
}
