// amplify/custom/websocket/connect.ts
const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB();

export const handler = async (event: any) => {
  console.log("Connect:", event.requestContext.connectionId);

  await ddb
    .putItem({
      TableName: process.env.CONNECTION_TABLE!,
      Item: { connectionId: { S: event.requestContext.connectionId } },
    })
    .promise();

  return { statusCode: 200 };
};
