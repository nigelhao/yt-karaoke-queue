import { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand, QueryCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { QueueItem } from '../types';
import { getUUID } from '../utils/uuid';

// Initialize DynamoDB client
const dynamoDb = new DynamoDBClient({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
});

export const createSession = async () => {
  const sessionId = getUUID();
  const timestamp = new Date().toISOString();

  const params = {
    TableName: `KaraokeSessions-${import.meta.env.MODE}`,
    Item: {
      sessionId: { S: sessionId },
      createdAt: { S: timestamp },
      active: { BOOL: true },
      currentSong: { NULL: true },
    },
  };

  try {
    await dynamoDb.send(new PutItemCommand(params));
    return {
      id: sessionId,
      createdAt: timestamp,
      active: true,
      currentSong: null,
    };
  } catch (error) {
    console.error('Error creating session:', error);
    throw new Error('Failed to create session');
  }
};

export const getSession = async (sessionId: string) => {
  const params = {
    TableName: `KaraokeSessions-${import.meta.env.MODE}`,
    Key: {
      sessionId: { S: sessionId },
    },
  };

  try {
    const { Item } = await dynamoDb.send(new GetItemCommand(params));
    if (!Item) {
      throw new Error('Session not found');
    }

    return {
      id: Item.sessionId.S!,
      createdAt: Item.createdAt.S!,
      active: Item.active.BOOL!,
      currentSong: Item.currentSong.NULL ? null : JSON.parse(Item.currentSong.S!),
    };
  } catch (error) {
    console.error('Error getting session:', error);
    throw new Error('Failed to get session');
  }
};

export const updateCurrentSong = async (sessionId: string, song: QueueItem | null) => {
  const params = {
    TableName: `KaraokeSessions-${import.meta.env.MODE}`,
    Key: {
      sessionId: { S: sessionId },
    },
    UpdateExpression: 'SET currentSong = :song',
    ExpressionAttributeValues: {
      ':song': song === null ? { NULL: true } : { S: JSON.stringify(song) },
    },
  };

  try {
    await dynamoDb.send(new UpdateItemCommand(params));
  } catch (error) {
    console.error('Error updating current song:', error);
    throw new Error('Failed to update current song');
  }
};

export const addToQueue = async (sessionId: string, item: QueueItem) => {
  const params = {
    TableName: `KaraokeQueues-${import.meta.env.MODE}`,
    Item: {
      sessionId: { S: sessionId },
      itemId: { S: item.id },
      videoId: { S: item.videoId },
      title: { S: item.title },
      thumbnail: { S: item.thumbnail },
      addedBy: { S: item.addedBy },
      addedAt: { S: item.addedAt },
      played: { BOOL: item.played },
    },
  };

  try {
    await dynamoDb.send(new PutItemCommand(params));
  } catch (error) {
    console.error('Error adding to queue:', error);
    throw new Error('Failed to add to queue');
  }
};

export const removeFromQueue = async (sessionId: string, itemId: string) => {
  const params = {
    TableName: `KaraokeQueues-${import.meta.env.MODE}`,
    Key: {
      sessionId: { S: sessionId },
      itemId: { S: itemId },
    },
  };

  try {
    await dynamoDb.send(new DeleteItemCommand(params));
  } catch (error) {
    console.error('Error removing from queue:', error);
    throw new Error('Failed to remove from queue');
  }
};

export const getQueue = async (sessionId: string): Promise<QueueItem[]> => {
  const params = {
    TableName: `KaraokeQueues-${import.meta.env.MODE}`,
    KeyConditionExpression: 'sessionId = :sessionId',
    ExpressionAttributeValues: {
      ':sessionId': { S: sessionId },
    },
    ScanIndexForward: true, // Sort by sort key (addedAt) in ascending order
  };

  try {
    const { Items } = await dynamoDb.send(new QueryCommand(params));
    if (!Items) return [];

    return Items.map(item => ({
      id: item.itemId.S!,
      videoId: item.videoId.S!,
      title: item.title.S!,
      thumbnail: item.thumbnail.S!,
      addedBy: item.addedBy.S!,
      addedAt: item.addedAt.S!,
      played: item.played.BOOL!,
    }));
  } catch (error) {
    console.error('Error getting queue:', error);
    throw new Error('Failed to get queue');
  }
};

export const fetchVideoDetails = async (videoId: string) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_ENDPOINT}/video-details/${videoId}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch video details');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching video details:', error);
    throw new Error('Failed to fetch video details');
  }
};