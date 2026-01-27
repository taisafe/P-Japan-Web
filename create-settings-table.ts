
import { Database } from 'better-sqlite3';
import DatabaseConstructor from 'better-sqlite3';

const db = new DatabaseConstructor('japan-politics.db');

try {
    console.log('Creating system_settings table...');
    db.exec(`
        CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY NOT NULL,
            value TEXT NOT NULL,
            updated_at INTEGER
        );
    `);
    console.log('system_settings table created successfully.');
} catch (error) {
    console.error('Error creating table:', error);
}

db.close();
