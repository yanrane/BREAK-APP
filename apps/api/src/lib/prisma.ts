import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL!;

// Neon serverless (WebSocket) hanya untuk Neon; Postgres lokal pakai driver pg biasa
const isNeon = connectionString.includes('neon.tech');

const prisma = new PrismaClient({
  adapter: isNeon
    ? new PrismaNeon({ connectionString })
    : new PrismaPg({ connectionString }),
});

export default prisma;
