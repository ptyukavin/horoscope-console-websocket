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

  // Connection table to store active connections
  const connectionTable = new Table(websocketStack, "ConnectionTable", {
    partitionKey: { name: "connectionId", type: AttributeType.STRING },
  });

  // Connect handler
  const connectHandler = new Function(websocketStack, "ConnectHandler", {
    runtime: Runtime.NODEJS_18_X,
    handler: "connect.handler",
    code: Code.fromInline(`
      const { DynamoDB } = require('@aws-sdk/client-dynamodb');
      const ddb = new DynamoDB();
      
      exports.handler = async (event) => {
        await ddb.putItem({
          TableName: process.env.CONNECTION_TABLE,
          Item: { connectionId: { S: event.requestContext.connectionId } }
        });
        return { statusCode: 200 };
      };
    `),
    environment: {
      CONNECTION_TABLE: connectionTable.tableName,
    },
  });

  // Disconnect handler
  const disconnectHandler = new Function(websocketStack, "DisconnectHandler", {
    runtime: Runtime.NODEJS_18_X,
    handler: "disconnect.handler",
    code: Code.fromInline(`
      const { DynamoDB } = require('@aws-sdk/client-dynamodb');
      const ddb = new DynamoDB();
      
      exports.handler = async (event) => {
        await ddb.deleteItem({
          TableName: process.env.CONNECTION_TABLE,
          Key: { connectionId: { S: event.requestContext.connectionId } }
        });
        return { statusCode: 200 };
      };
    `),
    environment: {
      CONNECTION_TABLE: connectionTable.tableName,
    },
  });

  connectionTable.grantReadWriteData(connectHandler);
  connectionTable.grantReadWriteData(disconnectHandler);

  const api = new WebSocketApi(websocketStack, "WebSocketApi", {
    connectRouteOptions: {
      integration: new WebSocketLambdaIntegration(
        "ConnectIntegration",
        connectHandler
      ),
    },
    disconnectRouteOptions: {
      integration: new WebSocketLambdaIntegration(
        "DisconnectIntegration",
        disconnectHandler
      ),
    },
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
