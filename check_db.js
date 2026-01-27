
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve('japan-politics.db');
const db = new Database(dbPath);

const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='people';").get();

if (table) {
    console.log("Table 'people' exists.");
} else {
    console.log("Table 'people' does NOT exist.");
}

const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='articles';").all();
console.log("Indexes on articles:", indexes);
