import { db } from '@/lib/db';
import { systemLogs } from '@/lib/db/schema';
import { v4 as uuidv4 } from 'uuid';

export type LogLevel = 'info' | 'warn' | 'error';

export const logger = {
    info: async (message: string, source: string = 'SYSTEM', metadata?: any) => {
        await logToDb('info', message, source, metadata);
    },
    warn: async (message: string, source: string = 'SYSTEM', metadata?: any) => {
        await logToDb('warn', message, source, metadata);
    },
    error: async (message: string, source: string = 'SYSTEM', metadata?: any) => {
        await logToDb('error', message, source, metadata);
    },
};

async function logToDb(level: LogLevel, message: string, source: string, metadata?: any) {
    if (typeof window !== 'undefined') {
        console.warn('Logger cannot be used on client-side');
        return;
    }

    try {
        await db.insert(systemLogs).values({
            id: uuidv4(),
            level,
            message,
            source,
            metadata: metadata ? JSON.stringify(metadata) : null,
        });

        // Also log to console for development visibility
        console.log(`[${level.toUpperCase()}] [${source}] ${message}`);
    } catch (error) {
        console.error('Failed to write log to DB:', error);
    }
}
