import dotenv from 'dotenv';
import path from 'path';
dotenv.config({
    path: path.join(process.cwd(), '.env')
});

const config = {
    port: process.env.PORT,
    dbUrl: process.env.DB_URL,
    dbName: process.env.DB_NAME,
    nodeEnv: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET,
};

export default config;