// amplify/custom/websocket/disconnect.ts
const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB();

export const handler = async (event: any) => {
  console.log("Disconnect:", event.requestContext.connectionId);

  await ddb
    .deleteItem({
      TableName: process.env.CONNECTION_TABLE!,
      Key: { connectionId: { S: event.requestContext.connectionId } },
    })
    .promise();

  return { statusCode: 200 };
};
