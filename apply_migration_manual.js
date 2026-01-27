const Database = require('better-sqlite3');
const db = new Database('japan-politics.db');

console.log('Starting manual migration...');

// Helper to check table existence
const tableExists = (tableName) => {
    const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?");
    const result = stmt.get(tableName);
    return !!result;
};

// Helper to check column existence
const columnExists = (tableName, columnName) => {
    const stmt = db.prepare(`PRAGMA table_info(${tableName})`);
    const columns = stmt.all();
    return columns.some(col => col.name === columnName);
};

// 1. Create article_people
if (!tableExists('article_people')) {
    console.log('Creating table article_people...');
    db.exec(`
    CREATE TABLE article_people (
        article_id text NOT NULL,
        person_id text NOT NULL,
        created_at integer DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(article_id, person_id),
        FOREIGN KEY (article_id) REFERENCES articles(id) ON UPDATE no action ON DELETE no action,
        FOREIGN KEY (person_id) REFERENCES people(id) ON UPDATE no action ON DELETE no action
    );
    CREATE INDEX article_people_article_idx ON article_people (article_id);
    `);
    console.log('Table article_people created.');
} else {
    console.log('Table article_people already exists.');
}

// 2. Create people (if not exists)
if (!tableExists('people')) {
    console.log('Creating table people...');
    db.exec(`
    CREATE TABLE people (
        id text PRIMARY KEY NOT NULL,
        name text NOT NULL,
        name_ja text,
        name_kana text,
        name_en text,
        role text,
        party text,
        image_url text,
        description text,
        wikipedia_id text,
        last_synced_at integer,
        created_at integer DEFAULT CURRENT_TIMESTAMP,
        updated_at integer
    );
    `);
    console.log('Table people created.');
} else {
    console.log('Table people already exists.');
}

// 3. Alter articles table
if (!columnExists('articles', 'title_cn')) {
    console.log('Adding title_cn to articles...');
    db.exec(`ALTER TABLE articles ADD title_cn text;`);
    console.log('Column title_cn added.');
} else {
    console.log('Column title_cn already exists.');
}

if (!columnExists('articles', 'tags')) {
    console.log('Adding tags to articles...');
    db.exec(`ALTER TABLE articles ADD tags text;`);
    console.log('Column tags added.');
} else {
    console.log('Column tags already exists.');
}

console.log('Manual migration completed.');
