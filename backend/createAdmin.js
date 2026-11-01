
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const readline = require("readline");
require("dotenv").config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "campusloop"
});

function ask(question) {
    return new Promise(resolve => {
        rl.question(question, resolve);
    });
}

async function createAdmin() {
    try {
        const name = (await ask("Administrator name: ")).trim();
        const email = (await ask("Administrator email: ")).trim().toLowerCase();
        const password = await ask("Administrator password: ");

        if (!name || !email || password.length < 8) {
            console.log("Enter all details. Password must have at least 8 characters.");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const sql = `
            INSERT INTO users (name, email, password_hash, role)
            VALUES (?, ?, ?, 'admin')
        `;

        db.query(sql, [name, email, hashedPassword], (error) => {
            if (error) {
                if (error.code === "ER_DUP_ENTRY") {
                    console.log("An account with this email already exists.");
                } else {
                    console.error("Could not create administrator:", error);
                }
            } else {
                console.log("Administrator account created successfully!");
            }

            db.end();
            rl.close();
        });
    } catch (error) {
        console.error(error);
        db.end();
        rl.close();
    }
}

createAdmin();
