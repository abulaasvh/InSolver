import { PrismaClient } from '@prisma/client';
import { Queue, Worker } from 'bullmq';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10)
};

console.log('InSolver BullMQ Worker initializing...');
console.log(`Connecting to Redis at ${redisConnection.host}:${redisConnection.port}...`);

export const OVERLAP_QUEUE = 'overlap-queue';
export const SLA_QUEUE = 'sla-queue';
export const INGESTION_QUEUE = 'ingestion-queue';
export const NOTIFICATION_QUEUE = 'notification-queue';

async function startWorkers() {
  try {
    console.log('BullMQ workers ready and listening for jobs.');
  } catch (err) {
    console.error('Worker failed to initialize:', err);
  }
}

startWorkers();
