const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const db = new sqlite3.Database(process.env.DB_PATH, (err) => {
    if (err) {
        console.error(`Error in database connection: `, err.message);
    } else {
        console.log('Connected to the SQLite database.');

        // Create user table
        db.run(`CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT NOT NULL UNIQUE,
            role TEXT DEFAULT 'normal user'
        )`, (err) => {
            if (err) {
                console.error("Error creating user table: ", err.message);
            } else {
                console.log("User table created successfully.");
            }
        });

        // Create task table
        db.run(`CREATE TABLE IF NOT EXISTS task (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'pending'
        )`, (err) => {
            if (err) {
                console.error("Error creating task table: ", err.message);
            } else {
                console.log("Task table created successfully.");
            }
        });
    }
});

module.exports = db;
