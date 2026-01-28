import { sqliteTable, text, integer, real, primaryKey, index } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

export const events = sqliteTable('events', {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    summary: text('summary'),
    heatScore: real('heat_score').default(0),
    firstSeenAt: integer('first_seen_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    lastUpdatedAt: integer('last_updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    status: text('status', { enum: ['active', 'archived', 'merged'] }).default('active'),
});

export const sources = sqliteTable('sources', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    url: text('url').notNull(),
    type: text('type', { enum: ['jp', 'en', 'twitter'] }).notNull(),
    category: text('category'), // e.g., 'mainstream', 'parliament', 'independent'
    weight: real('weight').default(1.0),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    lastFetchedAt: integer('last_fetched_at', { mode: 'timestamp' }),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
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
    titleCN: text('title_cn'),
    tags: text('tags', { mode: 'json' }), // JSON array of strings
    rawHtml: text('raw_html'),
    description: text('description'),
    author: text('author'),
    heatScore: real('heat_score').default(0),
    eventId: text('event_id').references(() => events.id),
    matchConfidence: real('match_confidence'),
    matchStatus: text('match_status', { enum: ['confirmed', 'pending', 'rejected'] }),
    isPaywalled: integer('is_paywalled', { mode: 'boolean' }).default(false),
    status: text('status', { enum: ['candidate', 'published', 'rejected'] }).default('published'),
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

export const systemLogs = sqliteTable('system_logs', {
    id: text('id').primaryKey(),
    level: text('level', { enum: ['info', 'warn', 'error'] }).notNull(),
    message: text('message').notNull(),
    source: text('source'), // e.g., 'MANUAL_UPDATE', 'SYSTEM', 'FETCHER'
    metadata: text('metadata'), // JSON string for extra details
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const systemSettings = sqliteTable('system_settings', {
    key: text('key').primaryKey(),
    value: text('value').notNull(), // JSON string
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});


export const people = sqliteTable('people', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    nameJa: text('name_ja'),
    nameKana: text('name_kana'),
    nameEn: text('name_en'),
    role: text('role'),
    party: text('party'),
    imageUrl: text('image_url'),
    description: text('description'),
    wikipediaId: text('wikipedia_id'),
    lastSyncedAt: integer('last_synced_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const articlePeople = sqliteTable('article_people', {
    articleId: text('article_id').notNull().references(() => articles.id),
    personId: text('person_id').notNull().references(() => people.id),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
    pk: primaryKey({ columns: [t.articleId, t.personId] }),
    idx: index('article_people_article_idx').on(t.articleId),
}));

export const eventsRelations = relations(events, ({ many }) => ({
    articles: many(articles),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
    event: one(events, {
        fields: [articles.eventId],
        references: [events.id],
    }),
    source: one(sources, {
        fields: [articles.sourceId],
        references: [sources.id],
    }),
    articlePeople: many(articlePeople),
}));

export const articlePeopleRelations = relations(articlePeople, ({ one }) => ({
    article: one(articles, {
        fields: [articlePeople.articleId],
        references: [articles.id],
    }),
    person: one(people, {
        fields: [articlePeople.personId],
        references: [people.id],
    }),
}));

export const peopleRelations = relations(people, ({ many }) => ({
    articlePeople: many(articlePeople),
}));

// Blacklist for permanent exclusion
export const blacklists = sqliteTable('blacklists', {
    id: text('id').primaryKey(),
    type: text('type', { enum: ['source', 'title', 'url'] }).notNull(),
    value: text('value').notNull(), // Source ID, title keyword, or URL pattern
    description: text('description'), // Optional description for reference
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});


