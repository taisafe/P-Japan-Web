import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const sources = sqliteTable('sources', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    url: text('url').notNull(),
    type: text('type', { enum: ['jp', 'en', 'twitter'] }).notNull(),
    category: text('category'), // e.g., 'mainstream', 'parliament', 'independent'
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    lastFetchedAt: integer('last_fetched_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const articles = sqliteTable('articles', {
    id: text('id').primaryKey(),
    sourceId: text('source_id').references(() => sources.id),
    title: text('title').notNull(),
    url: text('url').notNull().unique(),
    publishedAt: integer('published_at', { mode: 'timestamp' }),
    content: text('content'), // Cleaned text content
    contentCN: text('content_cn'), // Optional translated content
    rawHtml: text('raw_html'),
    description: text('description'),
    author: text('author'),
    heatScore: real('heat_score').default(0),
    isPaywalled: integer('is_paywalled', { mode: 'boolean' }).default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const fetchRuns = sqliteTable('fetch_runs', {
    id: text('id').primaryKey(),
    status: text('status', { enum: ['running', 'completed', 'failed'] }).notNull(),
    startedAt: integer('started_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    log: text('log'),
    errorCount: integer('error_count').default(0),
});
