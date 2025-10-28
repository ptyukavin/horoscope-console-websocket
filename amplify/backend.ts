// amplify/backend.ts
import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource.js";
import { data } from "./data/resource.js";
import { websocket } from "./custom/websocket/resource.js";

const backend = defineBackend({
  auth,
  data,
});

const { websocketEndpoint, connectionTableName } = websocket(backend);

// Add WebSocket endpoint to outputs
backend.addOutput({
  custom: {
    websocketEndpoint,
    connectionTableName,
  },
});
export default backend;
