// amplify/custom/websocket/resource.ts
import {
  WebSocketApi,
  WebSocketStage,
  WebSocketRoute,
} from "aws-cdk-lib/aws-apigatewayv2";
import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { Table, AttributeType } from "aws-cdk-lib/aws-dynamodb";
import { CfnOutput } from "aws-cdk-lib";

export const websocket = (backend: any) => {
  const websocketStack = backend.createStack("websocket-stack");

  // Connection table
  const connectionTable = new Table(websocketStack, "ConnectionTable", {
    partitionKey: { name: "connectionId", type: AttributeType.STRING },
  });

  const connectHandler = new Function(websocketStack, "ConnectHandler", {
    runtime: Runtime.NODEJS_20_X,
    handler: "index.handler",
    code: Code.fromInline(`
    const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
    const client = new DynamoDBClient();
    
    exports.handler = async (event) => {
      console.log('Connect:', event.requestContext.connectionId);
      
      const command = new PutItemCommand({
        TableName: process.env.CONNECTION_TABLE,
        Item: { connectionId: { S: event.requestContext.connectionId } }
      });
      
      await client.send(command);
      return { statusCode: 200 };
    };
  `),
    environment: {
      CONNECTION_TABLE: connectionTable.tableName,
    },
  });

  const disconnectHandler = new Function(websocketStack, "DisconnectHandler", {
    runtime: Runtime.NODEJS_20_X,
    handler: "index.handler",
    code: Code.fromInline(`
    const { DynamoDBClient, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
    const client = new DynamoDBClient();
    
    exports.handler = async (event) => {
      console.log('Disconnect:', event.requestContext.connectionId);
      
      const command = new DeleteItemCommand({
        TableName: process.env.CONNECTION_TABLE,
        Key: { connectionId: { S: event.requestContext.connectionId } }
      });
      
      await client.send(command);
      return { statusCode: 200 };
    };
  `),
    environment: {
      CONNECTION_TABLE: connectionTable.tableName,
    },
  });

  // Grant permissions
  connectionTable.grantReadWriteData(connectHandler);
  connectionTable.grantReadWriteData(disconnectHandler);

  const api = new WebSocketApi(websocketStack, "WebSocketApi");

  new WebSocketRoute(websocketStack, "ConnectRoute", {
    webSocketApi: api,
    routeKey: "$connect",
    integration: new WebSocketLambdaIntegration(
      "ConnectIntegration",
      connectHandler
    ),
  });

  new WebSocketRoute(websocketStack, "DisconnectRoute", {
    webSocketApi: api,
    routeKey: "$disconnect",
    integration: new WebSocketLambdaIntegration(
      "DisconnectIntegration",
      disconnectHandler
    ),
  });

  const stage = new WebSocketStage(websocketStack, "prod", {
    webSocketApi: api,
    stageName: "prod",
    autoDeploy: true,
  });

  new CfnOutput(websocketStack, "WebSocketEndpoint", {
    value: `${api.apiEndpoint}/prod`,
    exportName: "WebSocketEndpoint",
  });

  return {
    websocketEndpoint: `${api.apiEndpoint}/prod`,
    connectionTableName: connectionTable.tableName,
  };
};
