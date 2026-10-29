
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "campusloop"
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
        return;
    }

    console.log("MySQL database connected successfully!");
});

// Home route
app.get("/", (req, res) => {
    res.send("CampusLoop Backend is running!");
});

// Get all reports
app.get("/api/items", (req, res) => {
    const sql = "SELECT * FROM items ORDER BY created_at DESC";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({
                message: "Failed to fetch reports."
            });
        }

        res.json(results);
    });
});

// Get one report by ID
app.get("/api/items/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid report ID."
        });
    }

    const sql = "SELECT * FROM items WHERE id = ?";

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({
                message: "Failed to fetch report."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Report not found."
            });
        }

        res.json(results[0]);
    });
});

// Create a new report
app.post("/api/items", (req, res) => {
    const {
        reportType,
        itemName,
        description,
        location,
        date,
        contact
    } = req.body;

    if (
        !reportType ||
        !itemName?.trim() ||
        !description?.trim() ||
        !location?.trim() ||
        !date ||
        !contact?.trim()
    ) {
        return res.status(400).json({
            message: "Please provide all required item details."
        });
    }

    if (!["lost", "found"].includes(reportType)) {
        return res.status(400).json({
            message: "Report type must be lost or found."
        });
    }

    const sql = `
        INSERT INTO items
        (report_type, item_name, description, location, item_date, contact)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        reportType,
        itemName.trim(),
        description.trim(),
        location.trim(),
        date,
        contact.trim()
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({
                message: "Failed to save the report."
            });
        }

        res.status(201).json({
            message: "Report saved successfully!",
            id: result.insertId
        });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`CampusLoop backend running on port ${PORT}`);
});
