import { Db, MongoClient, ServerApiVersion } from 'mongodb';
import config from './config.js';

if (!config.dbUrl || !config.dbName) {
  throw new Error("Database configuration is missing");
}

const uri: string = config.dbUrl;
const dbName: string = config.dbName;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db: Db;

export const connectDB = async (): Promise<Db> => {
  try {
    await client.connect();

    db = client.db(dbName);

    console.log(`Connected to database: ${db.databaseName}`);

    return db;
  } catch (error: unknown) {
    console.error('MongoDB connection failed:', (error as Error).message);
    throw error;
  }
};

export const getDB = (): Db => {
  if (!db) {
    throw new Error('Database not initialized! Call connectDB first.');
  }

  return db;
};

export const disconnectDB = async (): Promise<void> => {
  await client.close();
};