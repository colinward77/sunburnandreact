// db.js  – CommonJS Dynamo helper (userID version)

const { v4: uuid } = require('uuid');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand
} = require('@aws-sdk/lib-dynamodb');

const TABLE          = 'userData2';          // your table name
const USERNAME_INDEX = 'username-index';    // GSI created earlier
const PK             = 'userID';            // <-- match partition-key name

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// ---------- helpers ----------
async function createUser({ username, password, hairColor, eyeColor, skinType }) {
  const userID = uuid();                    // variable now matches PK attribute
  await doc.send(new PutCommand({
    TableName: TABLE,
    Item: { [PK]: userID, username, password, hairColor, eyeColor, skinType },
    ConditionExpression: 'attribute_not_exists(username)'
  }));
  return userID;
}

async function findUserByUsername(username) {
  const out = await doc.send(new QueryCommand({
    TableName: TABLE,
    IndexName: USERNAME_INDEX,
    KeyConditionExpression: 'username = :u',
    ExpressionAttributeValues: { ':u': username },
    Limit: 1
  }));
  return out.Items?.[0] || null;
}

async function getUserById(userID) {
  const out = await doc.send(new GetCommand({
    TableName: TABLE,
    Key: { [PK]: userID }
  }));
  return out.Item || null;
}

module.exports = { createUser, findUserByUsername, getUserById };
