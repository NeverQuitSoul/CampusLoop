
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing from environment variables.");
    process.exit(1);
}

app.use(cors());
app.use(express.json());

const uploadDirectory = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

app.use("/uploads", express.static(uploadDirectory));

// MySQL connection pool
const useDatabaseSSL = process.env.DB_SSL === "true";

const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || (useDatabaseSSL ? 4000 : 3306)),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "campusloop",
    dateStrings: true,

    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 5,
    idleTimeout: 30000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,

    ...(useDatabaseSSL
        ? {
              ssl: {
                  ca: fs.readFileSync(
                      path.join(__dirname, "isrgrootx1.pem")
                  ),
                  minVersion: "TLSv1.2"
              }
          }
        : {})
});

// Check database connection
db.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection failed:", err);
    } else {
        console.log("Connected to CampusLoop database.");
        connection.release();
    }
});

// Image upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, `${crypto.randomUUID()}${extension}`);
    }
});

const upload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, PNG and WEBP images are allowed."));
        }
    }
});

// Student authentication
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Please log in to continue."
        });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
        if (error) {
            return res.status(401).json({
                message: "Your session is invalid or expired. Please log in again."
            });
        }

        req.user = user;
        next();
    });
}

// Admin authorization
function checkAdmin(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            message: "Administrator access required."
        });
    }

    next();
}

// Student registration
app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please provide your name, email and password."
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanPassword = password;

        const collegeDomain = (
            process.env.COLLEGE_EMAIL_DOMAIN || "nbkrist.org"
        ).toLowerCase();

        if (!cleanEmail.endsWith(`@${collegeDomain}`)) {
            return res.status(400).json({
                message: `Please use your college email ending with @${collegeDomain}.`
            });
        }

        if (cleanName.length < 2 || cleanName.length > 100) {
            return res.status(400).json({
                message: "Name must contain between 2 and 100 characters."
            });
        }

        if (cleanPassword.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters."
            });
        }

        const hashedPassword = await bcrypt.hash(cleanPassword, 12);

        const sql = `
            INSERT INTO users (name, email, password_hash, role)
            VALUES (?, ?, ?, 'student')
        `;

        db.query(sql, [cleanName, cleanEmail, hashedPassword], (error) => {
            if (error) {
                if (error.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        message: "An account with this email already exists."
                    });
                }

                console.error("Registration database error:", error);

                return res.status(500).json({
                    message: "Could not create your account."
                });
            }

            res.status(201).json({
                message: "Student account created successfully!"
            });
        });
    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).json({
            message: "Registration failed."
        });
    }
});

// Student login
app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Please enter your email and password."
        });
    }

    const cleanEmail = email.trim().toLowerCase();

    const sql = `
        SELECT id, name, email, password_hash, role
        FROM users
        WHERE email = ? AND role = 'student'
        LIMIT 1
    `;

    db.query(sql, [cleanEmail], async (error, results) => {
        if (error) {
            console.error("Login database error:", error);

            return res.status(500).json({
                message: "Login failed."
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: "Invalid student email or password."
            });
        }

        const user = results[0];

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid student email or password."
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.json({
            message: "Login successful!",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    });
});

// Admin login
app.post("/api/auth/admin-login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Please enter your email and password."
        });
    }

    const cleanEmail = email.trim().toLowerCase();

    const sql = `
        SELECT id, name, email, password_hash, role
        FROM users
        WHERE email = ? AND role = 'admin'
        LIMIT 1
    `;

    db.query(sql, [cleanEmail], async (error, results) => {
        if (error) {
            console.error("Admin login database error:", error);

            return res.status(500).json({
                message: "Administrator login failed."
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: "Invalid administrator email or password."
            });
        }

        const admin = results[0];

        const passwordMatches = await bcrypt.compare(
            password,
            admin.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid administrator email or password."
            });
        }

        const token = jwt.sign(
            {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.json({
            message: "Administrator login successful!",
            token,
            user: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    });
});

// Get logged-in user
app.get("/api/auth/me", authenticateToken, (req, res) => {
    res.json({
        user: req.user
    });
});

// Common public item fields
const publicItemFields = `
    id,
    report_type,
    item_name,
    description,
    location,
    item_date,
    created_at,
    status,
    image_path
`;

// Backend home route
app.get("/", (req, res) => {
    res.send("CampusLoop Backend is running!");
});

// Get all reports
app.get("/api/items", (req, res) => {
    const sql = `
        SELECT ${publicItemFields}
        FROM items
        ORDER BY created_at DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error("Fetch reports database error:", error);

            return res.status(500).json({
                message: "Could not fetch reports."
            });
        }

        res.json(results);
    });
});

// Get reports by category
app.get("/api/items/category/:type", (req, res) => {
    const type = req.params.type.toLowerCase();

    if (!["lost", "found"].includes(type)) {
        return res.status(400).json({
            message: "Invalid report category."
        });
    }

    const sql = `
        SELECT ${publicItemFields}
        FROM items
        WHERE report_type = ?
        AND status != 'Resolved'
        ORDER BY created_at DESC
    `;

    db.query(sql, [type], (error, results) => {
        if (error) {
            console.error("Category reports database error:", error);

            return res.status(500).json({
                message: "Could not fetch reports."
            });
        }

        res.json(results);
    });
});

// Get completed reports
app.get("/api/items/completed", (req, res) => {
    const sql = `
        SELECT ${publicItemFields}
        FROM items
        WHERE status = 'Resolved'
        ORDER BY created_at DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error("Completed reports database error:", error);

            return res.status(500).json({
                message: "Could not fetch returned items."
            });
        }

        res.json(results);
    });
});

// Get one report by ID
app.get("/api/items/:id", (req, res) => {
    const sql = `
        SELECT ${publicItemFields}
        FROM items
        WHERE id = ?
    `;

    db.query(sql, [req.params.id], (error, results) => {
        if (error) {
            console.error("Single report database error:", error);

            return res.status(500).json({
                message: "Could not fetch report."
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

// Submit a new report
app.post(
    "/api/items",
    authenticateToken,
    (req, res, next) => {
        upload.single("image")(req, res, (uploadError) => {
            if (uploadError) {
                return res.status(400).json({
                    message: uploadError.message
                });
            }

            next();
        });
    },
    (req, res) => {
        if (req.user.role !== "student") {
            if (req.file) {
                fs.unlink(req.file.path, () => {});
            }

            return res.status(403).json({
                message: "Only students can submit reports."
            });
        }

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
            !["lost", "found"].includes(reportType.toLowerCase()) ||
            !itemName ||
            !description ||
            !location ||
            !date ||
            !contact
        ) {
            if (req.file) {
                fs.unlink(req.file.path, () => {});
            }

            return res.status(400).json({
                message: "Please provide all required report details."
            });
        }

        const imagePath = req.file
            ? `/uploads/${req.file.filename}`
            : null;

        const sql = `
            INSERT INTO items
            (
                user_id,
                report_type,
                item_name,
                description,
                location,
                item_date,
                contact,
                status,
                image_path
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Active', ?)
        `;

        db.query(
            sql,
            [
                req.user.id,
                reportType.toLowerCase(),
                itemName,
                description,
                location,
                date,
                contact,
                imagePath
            ],
            (error, result) => {
                if (error) {
                    console.error("Submit report database error:", error);

                    if (req.file) {
                        fs.unlink(req.file.path, () => {});
                    }

                    return res.status(500).json({
                        message: "Could not save the report."
                    });
                }

                res.status(201).json({
                    message: "Report submitted successfully!",
                    id: result.insertId
                });
            }
        );
    }
);

// Mark report as returned
app.put(
    "/api/items/:id/resolve",
    authenticateToken,
    checkAdmin,
    (req, res) => {
        const sql = `
            UPDATE items
            SET status = 'Resolved'
            WHERE id = ?
        `;

        db.query(sql, [req.params.id], (error, result) => {
            if (error) {
                console.error("Resolve report database error:", error);

                return res.status(500).json({
                    message: "Could not update report."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Report not found."
                });
            }

            res.json({
                message: "Item successfully marked as returned."
            });
        });
    }
);

// Delete report
app.delete(
    "/api/items/:id",
    authenticateToken,
    checkAdmin,
    (req, res) => {
        const selectSql = `
            SELECT image_path
            FROM items
            WHERE id = ?
        `;

        db.query(selectSql, [req.params.id], (selectError, results) => {
            if (selectError) {
                console.error("Find report before delete error:", selectError);

                return res.status(500).json({
                    message: "Could not find report."
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Report not found."
                });
            }

            const imagePath = results[0].image_path;

            const deleteSql = "DELETE FROM items WHERE id = ?";

            db.query(deleteSql, [req.params.id], (deleteError) => {
                if (deleteError) {
                    console.error("Delete report database error:", deleteError);

                    return res.status(500).json({
                        message: "Could not delete report."
                    });
                }

                if (imagePath) {
                    const imageFile = path.join(
                        uploadDirectory,
                        path.basename(imagePath)
                    );

                    if (fs.existsSync(imageFile)) {
                        fs.unlink(imageFile, () => {});
                    }
                }

                res.json({
                    message: "Report deleted successfully."
                });
            });
        });
    }
);

// General error handler
app.use((err, req, res, next) => {
    console.error("Server error:", err);

    if (res.headersSent) {
        return next(err);
    }

    res.status(500).json({
        message: "Something went wrong on the server."
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`CampusLoop server running on port ${PORT}`);
});
