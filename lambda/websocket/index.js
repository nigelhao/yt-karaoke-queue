const AWS = require("aws-sdk");

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const apiGatewayManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint: process.env.WEBSOCKET_ENDPOINT,
});

// Helper function to get session connections
async function getSessionConnections(sessionId) {
    const params = {
        TableName: process.env.CONNECTIONS_TABLE,
        IndexName: "SessionIdIndex",
        KeyConditionExpression: "sessionId = :sessionId",
        ExpressionAttributeValues: {
            ":sessionId": sessionId,
        },
    };

    const result = await dynamoDB.query(params).promise();
    return result.Items;
}

// Helper function to broadcast message to all connections in a session
async function broadcastToSession(sessionId, message) {
    const connections = await getSessionConnections(sessionId);
    const postToConnection = async ({ connectionId }) => {
        try {
            await apiGatewayManagementApi
                .postToConnection({
                    ConnectionId: connectionId,
                    Data: JSON.stringify(message),
                })
                .promise();
        } catch (error) {
            if (error.statusCode === 410) {
                // Remove stale connection
                await dynamoDB
                    .delete({
                        TableName: process.env.CONNECTIONS_TABLE,
                        Key: { connectionId },
                    })
                    .promise();
            }
        }
    };

    await Promise.all(connections.map(postToConnection));
}

// Handle WebSocket connect
async function handleConnect(event) {
    const connectionId = event.requestContext.connectionId;
    const sessionId = event.queryStringParameters?.sessionId;

    if (!sessionId) {
        return {
            statusCode: 400,
            body: "sessionId is required",
        };
    }

    // Store connection details
    await dynamoDB
        .put({
            TableName: process.env.CONNECTIONS_TABLE,
            Item: {
                connectionId,
                sessionId,
                timestamp: new Date().toISOString(),
            },
        })
        .promise();

    // Broadcast join message to session
    await broadcastToSession(sessionId, {
        action: "JOIN_SESSION",
        payload: { connectionId },
    });

    return { statusCode: 200, body: "Connected" };
}

// Handle WebSocket disconnect
async function handleDisconnect(event) {
    const connectionId = event.requestContext.connectionId;

    // Get session ID before deleting connection
    const connection = await dynamoDB
        .get({
            TableName: process.env.CONNECTIONS_TABLE,
            Key: { connectionId },
        })
        .promise();

    if (connection.Item) {
        const { sessionId } = connection.Item;

        // Delete connection
        await dynamoDB
            .delete({
                TableName: process.env.CONNECTIONS_TABLE,
                Key: { connectionId },
            })
            .promise();

        // Broadcast leave message to session
        await broadcastToSession(sessionId, {
            action: "LEAVE_SESSION",
            payload: { connectionId },
        });
    }

    return { statusCode: 200, body: "Disconnected" };
}

// Handle WebSocket messages
async function handleMessage(event) {
    const connectionId = event.requestContext.connectionId;
    const message = JSON.parse(event.body);

    // Get session ID for the connection
    const connection = await dynamoDB
        .get({
            TableName: process.env.CONNECTIONS_TABLE,
            Key: { connectionId },
        })
        .promise();

    if (!connection.Item) {
        return {
            statusCode: 400,
            body: "Connection not found",
        };
    }

    const { sessionId } = connection.Item;

    // Broadcast message to all connections in the session
    await broadcastToSession(sessionId, message);

    return { statusCode: 200, body: "Message sent" };
}

// Main handler
exports.handler = async (event) => {
    try {
        const routeKey = event.requestContext.routeKey;

        switch (routeKey) {
            case "$connect":
                return await handleConnect(event);
            case "$disconnect":
                return await handleDisconnect(event);
            case "message":
                return await handleMessage(event);
            default:
                return {
                    statusCode: 400,
                    body: `Unsupported route: ${routeKey}`,
                };
        }
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: "Internal server error",
        };
    }
};
