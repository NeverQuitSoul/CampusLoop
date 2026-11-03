const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing from environment variables.");
    process.exit(1);
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use(cors());
app.use(express.json());

const uploadDirectory = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

app.use("/uploads", express.static(uploadDirectory));

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

db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        item_id INT NULL,
        title VARCHAR(180) NOT NULL,
        message VARCHAR(500) NOT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notifications_user (user_id, created_at)
    )
`, (error) => { if (error) console.error("Notifications table setup failed:", error); });

db.query(`
    CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        recipient_id INT NOT NULL,
        item_id INT NOT NULL,
        message TEXT NOT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_messages_recipient (recipient_id, created_at),
        INDEX idx_messages_sender (sender_id, created_at)
    )
`, (error) => { if (error) console.error("Messages table setup failed:", error); });

db.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection failed:", err);
    } else {
        console.log("Connected to CampusLoop database.");
        connection.release();
    }
});

function expireOldReports(callback) {
    const sql = `
        UPDATE items
        SET status = 'Expired'
        WHERE status = 'Active'
        AND expires_at IS NOT NULL
        AND expires_at <= CURRENT_TIMESTAMP
    `;

    db.query(sql, (error, result) => {
        if (error) {
            console.error("Automatic expiry error:", error);

            if (callback) callback(error);
            return;
        }

        if (result.affectedRows > 0) {
            console.log(
                `${result.affectedRows} report(s) automatically expired.`
            );
        }

        if (callback) callback(null, result);
    });
}

expireOldReports();

setInterval(() => {
    expireOldReports();
}, 60 * 1000);

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "campusloop",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        resource_type: "image"
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

async function deleteCloudinaryImage(publicId) {
    if (!publicId) return;

    try {
        await cloudinary.uploader.destroy(publicId);
        console.log("Cloudinary image deleted:", publicId);
    } catch (error) {
        console.error("Cloudinary image deletion failed:", error);
    }
}

async function removeUploadedFile(file) {
    if (!file) return;

    if (file.filename) {
        await deleteCloudinaryImage(file.filename);
    }
}

async function removeStoredImage(imagePath) {
    if (!imagePath) return;

    if (imagePath.includes("res.cloudinary.com")) {
        try {
            const pathname = new URL(imagePath).pathname;
            const uploadIndex = pathname.indexOf("/upload/");

            if (uploadIndex === -1) return;

            let publicId = pathname.substring(uploadIndex + 8);

            publicId = publicId.replace(/^v\d+\//, "");
            publicId = publicId.replace(/\.[^/.]+$/, "");

            await deleteCloudinaryImage(publicId);
        } catch (error) {
            console.error("Could not process Cloudinary image path:", error);
        }

        return;
    }

    if (imagePath.startsWith("/uploads/")) {
        const imageFile = path.join(
            uploadDirectory,
            path.basename(imagePath)
        );

        if (fs.existsSync(imageFile)) {
            fs.unlink(imageFile, (error) => {
                if (error) {
                    console.error("Local image deletion failed:", error);
                }
            });
        }
    }
}

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

function checkAdmin(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            message: "Administrator access required."
        });
    }

    next();
}

const publicItemFields = `
    id,
    report_type,
    item_name,
    description,
    location,
    item_date,
    created_at,
    expires_at,
    status,
    image_path
`;

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

app.get("/api/auth/me", authenticateToken, (req, res) => {
    db.query(
        "SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1",
        [req.user.id],
        (error, rows) => {
            if (error) return res.status(500).json({ message: "Could not verify your account." });
            if (!rows.length) return res.status(404).json({ message: "Account not found." });
            res.json({ user: rows[0] });
        }
    );
});

app.get("/api/profile", authenticateToken, (req, res) => {
    db.query(`
        SELECT u.id, u.name, u.email, u.role,
            (SELECT COUNT(*) FROM items WHERE user_id = u.id) AS totalReports,
            (SELECT COUNT(*) FROM items WHERE user_id = u.id AND status = 'Active') AS activeReports,
            (SELECT COUNT(*) FROM items WHERE user_id = u.id AND status = 'Resolved') AS returnedReports
        FROM users u WHERE u.id = ? LIMIT 1
    `, [req.user.id], (error, rows) => {
        if (error) return res.status(500).json({ message: "Could not load your profile." });
        if (!rows.length) return res.status(404).json({ message: "Profile not found." });
        res.json(rows[0]);
    });
});

app.put("/api/profile", authenticateToken, (req, res) => {
    const name = String(req.body.name || "").trim();
    if (name.length < 2 || name.length > 100) {
        return res.status(400).json({ message: "Name must contain between 2 and 100 characters." });
    }
    db.query("UPDATE users SET name = ? WHERE id = ?", [name, req.user.id], (error, result) => {
        if (error) return res.status(500).json({ message: "Could not update your profile." });
        if (!result.affectedRows) return res.status(404).json({ message: "Account not found." });
        db.query("SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1", [req.user.id], (readError, rows) => {
            if (readError || !rows.length) return res.status(500).json({ message: "Profile updated, but could not reload it." });
            res.json({ message: "Profile updated successfully.", user: rows[0] });
        });
    });
});

app.get("/", (req, res) => {
    res.send("CampusLoop Backend is running!");
});



app.get("/api/notifications", authenticateToken, (req, res) => {
    db.query(
        "SELECT id, item_id, title, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        [req.user.id],
        (error, rows) => {
            if (error) {
                console.error("Notifications fetch error:", error);
                return res.status(500).json({ message: "Could not load notifications." });
            }
            res.json(rows);
        }
    );
});

app.put("/api/notifications/:id/read", authenticateToken, (req, res) => {
    db.query(
        "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
        [req.params.id, req.user.id],
        (error, result) => {
            if (error) {
                console.error("Notification update error:", error);
                return res.status(500).json({ message: "Could not update notification." });
            }
            if (!result.affectedRows) return res.status(404).json({ message: "Notification not found." });
            res.json({ message: "Notification marked as read." });
        }
    );
});

app.post("/api/messages", authenticateToken, (req, res) => {
    if (req.user.role !== "student") return res.status(403).json({ message: "Only students can contact reporters." });
    const itemId = Number(req.body.itemId);
    const message = String(req.body.message || "").trim();
    if (!Number.isInteger(itemId) || itemId <= 0 || message.length < 2 || message.length > 1500) {
        return res.status(400).json({ message: "Enter a message between 2 and 1500 characters." });
    }
    db.query("SELECT id, user_id, item_name FROM items WHERE id = ? AND status <> 'Expired' LIMIT 1", [itemId], (findError, rows) => {
        if (findError) return res.status(500).json({ message: "Could not find this report." });
        if (!rows.length) return res.status(404).json({ message: "This report is no longer available." });
        if (Number(rows[0].user_id) === Number(req.user.id)) {
            return res.status(400).json({ message: "You cannot message yourself about your own report." });
        }
        db.query(
            "INSERT INTO messages (sender_id, recipient_id, item_id, message) VALUES (?, ?, ?, ?)",
            [req.user.id, rows[0].user_id, itemId, message],
            (insertError, result) => {
                if (insertError) return res.status(500).json({ message: "Could not send your message." });
                db.query(
                    "INSERT INTO notifications (user_id, item_id, title, message) VALUES (?, ?, ?, ?)",
                    [rows[0].user_id, itemId, "New message about a report", "A student sent you a private message about " + rows[0].item_name + "."],
                    noticeError => { if (noticeError) console.error("Message notification error:", noticeError); }
                );
                res.status(201).json({ message: "Message sent to the reporter.", id: result.insertId });
            }
        );
    });
});

app.post("/api/messages/:id/reply", authenticateToken, (req, res) => {
    if (req.user.role !== "student") return res.status(403).json({ message: "Only students can reply to messages." });
    const message = String(req.body.message || "").trim();
    if (message.length < 2 || message.length > 1500) {
        return res.status(400).json({ message: "Enter a message between 2 and 1500 characters." });
    }
    db.query(
        "SELECT sender_id, recipient_id, item_id FROM messages WHERE id = ? AND (sender_id = ? OR recipient_id = ?) LIMIT 1",
        [req.params.id, req.user.id, req.user.id],
        (findError, rows) => {
            if (findError) return res.status(500).json({ message: "Could not find this conversation." });
            if (!rows.length) return res.status(404).json({ message: "Message not found." });
            const original = rows[0];
            const recipientId = Number(original.sender_id) === Number(req.user.id)
                ? original.recipient_id
                : original.sender_id;
            db.query(
                "INSERT INTO messages (sender_id, recipient_id, item_id, message) VALUES (?, ?, ?, ?)",
                [req.user.id, recipientId, original.item_id, message],
                (insertError, result) => {
                    if (insertError) return res.status(500).json({ message: "Could not send your reply." });
                    db.query(
                        "INSERT INTO notifications (user_id, item_id, title, message) VALUES (?, ?, ?, ?)",
                        [recipientId, original.item_id, "New message reply", "You received a reply about a CampusLoop report."],
                        noticeError => { if (noticeError) console.error("Reply notification error:", noticeError); }
                    );
                    res.status(201).json({ message: "Reply sent.", id: result.insertId });
                }
            );
        }
    );
});

app.get("/api/messages/inbox", authenticateToken, (req, res) => {
    db.query(`
        SELECT m.id, m.item_id, m.message, m.is_read, m.created_at,
            u.name AS sender_name, i.item_name
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        JOIN items i ON i.id = m.item_id
        WHERE m.recipient_id = ?
        ORDER BY m.created_at DESC LIMIT 100
    `, [req.user.id], (error, rows) => {
        if (error) return res.status(500).json({ message: "Could not load your inbox." });
        res.json(rows);
    });
});

app.get("/api/messages/sent", authenticateToken, (req, res) => {
    db.query(`
        SELECT m.id, m.item_id, m.message, m.is_read, m.created_at,
            u.name AS recipient_name, i.item_name
        FROM messages m
        JOIN users u ON u.id = m.recipient_id
        JOIN items i ON i.id = m.item_id
        WHERE m.sender_id = ?
        ORDER BY m.created_at DESC LIMIT 100
    `, [req.user.id], (error, rows) => {
        if (error) return res.status(500).json({ message: "Could not load your sent messages." });
        res.json(rows);
    });
});

app.put("/api/messages/:id/read", authenticateToken, (req, res) => {
    db.query("UPDATE messages SET is_read = 1 WHERE id = ? AND recipient_id = ?", [req.params.id, req.user.id], (error, result) => {
        if (error) return res.status(500).json({ message: "Could not update this message." });
        if (!result.affectedRows) return res.status(404).json({ message: "Message not found." });
        res.json({ message: "Message marked as read." });
    });
});

app.get("/api/admin/overview", authenticateToken, checkAdmin, async (req, res) => {
    try {
        const [statsRows] = await db.promise().query(`
            SELECT
                COUNT(*) AS totalReports,
                SUM(status = 'Active') AS activeReports,
                SUM(status = 'Expired') AS expiredReports,
                SUM(status = 'Resolved') AS returnedReports,
                SUM(report_type = 'lost') AS lostReports,
                SUM(report_type = 'found') AS foundReports,
                (SELECT COUNT(*) FROM users) AS totalUsers
            FROM items
        `);
        const [monthlyRows] = await db.promise().query(`
            SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
                   COUNT(*) AS total,
                   SUM(report_type = 'lost') AS lost,
                   SUM(report_type = 'found') AS found
            FROM items
            WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 5 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        `);
        const [userRows] = await db.promise().query(`
            SELECT id, name, email, role
            FROM users
            ORDER BY id DESC
            LIMIT 100
        `);
        const [reportRows] = await db.promise().query(`
            SELECT i.id, i.report_type, i.item_name, i.location, i.status,
                   i.created_at, i.expires_at, u.name AS reporter_name,
                   u.email AS reporter_email
            FROM items i
            LEFT JOIN users u ON u.id = i.user_id
            ORDER BY i.created_at DESC
            LIMIT 100
        `);
        res.json({
            stats: statsRows[0],
            monthlyReports: monthlyRows,
            users: userRows,
            reports: reportRows
        });
    } catch (error) {
        console.error("Admin overview error:", error);
        res.status(500).json({ message: "Could not load administrator dashboard." });
    }
});

app.get("/api/items", (req, res) => {
    const sql = `
        SELECT ${publicItemFields}
        FROM items
        WHERE status = 'Active'
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
        AND status = 'Active'
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

app.get("/api/items/mine", authenticateToken, (req, res) => {
    const sql = `
        SELECT ${publicItemFields}, contact
        FROM items
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;

    db.query(sql, [req.user.id], (error, results) => {
        if (error) {
            console.error("My reports database error:", error);

            return res.status(500).json({
                message: "Could not fetch your reports."
            });
        }

        res.json(results);
    });
});

app.put(
    "/api/items/:id",
    authenticateToken,
    (req, res, next) => {
        upload.single("image")(req, res, (error) => {
            if (error) return res.status(400).json({ message: error.message });
            next();
        });
    },
    (req, res) => {
        if (req.user.role !== "student") {
            removeUploadedFile(req.file);
            return res.status(403).json({ message: "Only students can edit reports." });
        }

        const { reportType, itemName, description, location, date, contact } = req.body;
        if (!["lost", "found"].includes(String(reportType).toLowerCase()) ||
            !itemName?.trim() || !description?.trim() || !location?.trim() || !date || !contact?.trim()) {
            removeUploadedFile(req.file);
            return res.status(400).json({ message: "Please provide all required details." });
        }

        db.query(
            "SELECT image_path FROM items WHERE id = ? AND user_id = ? AND status IN ('Active', 'Expired')",
            [req.params.id, req.user.id],
            (findError, rows) => {
                if (findError) {
                    removeUploadedFile(req.file);
                    return res.status(500).json({ message: "Could not find your report." });
                }
                if (!rows.length) {
                    removeUploadedFile(req.file);
                    return res.status(404).json({ message: "Report not found or cannot be edited." });
                }

                const oldImage = rows[0].image_path;
                const imagePath = req.file ? req.file.path : oldImage;
                const sql = `UPDATE items SET report_type=?, item_name=?, description=?,
                    location=?, item_date=?, contact=?, image_path=?
                    WHERE id=? AND user_id=? AND status IN ('Active','Expired')`;

                db.query(sql, [
                    reportType.toLowerCase(), itemName.trim(), description.trim(),
                    location.trim(), date, contact.trim(), imagePath,
                    req.params.id, req.user.id
                ], (updateError, result) => {
                    if (updateError) {
                        removeUploadedFile(req.file);
                        return res.status(500).json({ message: "Could not save your changes." });
                    }
                    if (!result.affectedRows) {
                        removeUploadedFile(req.file);
                        return res.status(404).json({ message: "Report could not be updated." });
                    }
                    if (req.file && oldImage) removeStoredImage(oldImage);
                    res.json({ message: "Your report details have been updated successfully." });
                });
            }
        );
    }
);

app.put(
    "/api/items/:id/renew",
    authenticateToken,
    (req, res) => {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can renew reports."
            });
        }

        const sql = `
            UPDATE items
            SET
                status = 'Active',
                expires_at = DATE_ADD(
                    CURRENT_TIMESTAMP,
                    INTERVAL 90 DAY
                )
            WHERE id = ?
            AND user_id = ?
            AND status = 'Expired'
        `;

        db.query(
            sql,
            [req.params.id, req.user.id],
            (error, result) => {
                if (error) {
                    console.error("Report renewal error:", error);

                    return res.status(500).json({
                        message: "Could not renew your report."
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(400).json({
                        message: "Report cannot be renewed. It may not exist, may not belong to you, or may not be expired."
                    });
                }

                res.json({
                    message: "Report renewed successfully for another 90 days."
                });
            }
        );
    }
);

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
            removeUploadedFile(req.file);

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
            removeUploadedFile(req.file);

            return res.status(400).json({
                message: "Please provide all required report details."
            });
        }

        const imagePath = req.file ? req.file.path : null;

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
                image_path,
                expires_at
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, 'Active', ?,
                DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 90 DAY)
            )
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

                    removeUploadedFile(req.file);

                    return res.status(500).json({
                        message: "Could not save the report."
                    });
                }

                db.query(
                    "SELECT id, user_id FROM items WHERE id <> ? AND status = 'Active' AND LOWER(item_name) = LOWER(?) AND report_type <> ?",
                    [result.insertId, itemName.trim(), reportType.toLowerCase()],
                    (matchError, matches) => {
                        if (matchError) {
                            console.error("Matching report lookup error:", matchError);
                            return;
                        }
                        matches.forEach(match => {
                            if (Number(match.user_id) === Number(req.user.id)) return;
                            db.query(
                                "INSERT INTO notifications (user_id, item_id, title, message) VALUES (?, ?, ?, ?)",
                                [match.user_id, result.insertId, "A possible item match was found", 'A new ' + reportType.toLowerCase() + ' report for "' + itemName.trim() + '" may match one of your reports.'],
                                noticeError => { if (noticeError) console.error("Match notification error:", noticeError); }
                            );
                            db.query(
                                "INSERT INTO notifications (user_id, item_id, title, message) VALUES (?, ?, ?, ?)",
                                [req.user.id, match.id, "A possible item match was found", 'Your report for "' + itemName.trim() + '" may match a newly submitted campus report.'],
                                noticeError => { if (noticeError) console.error("Match notification error:", noticeError); }
                            );
                        });
                    }
                );

                res.status(201).json({
                    message: "Report submitted successfully!",
                    id: result.insertId
                });
            }
        );
    }
);


app.put("/api/items/:id/resolve", authenticateToken, checkAdmin, (req, res) => {
    db.query("SELECT user_id, item_name FROM items WHERE id = ?", [req.params.id], (findError, rows) => {
        if (findError) return res.status(500).json({ message: "Could not find report." });
        if (!rows.length) return res.status(404).json({ message: "Report not found." });
        db.query("UPDATE items SET status = 'Resolved' WHERE id = ?", [req.params.id], (error, result) => {
            if (error) {
                console.error("Resolve report database error:", error);
                return res.status(500).json({ message: "Could not update report." });
            }
            if (!result.affectedRows) return res.status(404).json({ message: "Report not found." });
            db.query(
                "INSERT INTO notifications (user_id, item_id, title, message) VALUES (?, ?, ?, ?)",
                [rows[0].user_id, req.params.id, "Your item was marked as returned", 'The report for "' + rows[0].item_name + '" has been marked as returned by an administrator.'],
                noticeError => { if (noticeError) console.error("Return notification error:", noticeError); }
            );
            res.json({ message: "Item successfully marked as returned." });
        });
    });
});

app.delete(
    "/api/items/:id",
    authenticateToken,
    (req, res) => {
        const isStudent = req.user.role === "student";
        if (!isStudent && req.user.role !== "admin") {
            return res.status(403).json({ message: "You are not allowed to delete reports." });
        }

        const selectSql = isStudent
            ? "SELECT image_path FROM items WHERE id = ? AND user_id = ? AND status IN ('Active', 'Expired')"
            : "SELECT image_path FROM items WHERE id = ?";
        const values = isStudent ? [req.params.id, req.user.id] : [req.params.id];

        db.query(selectSql, values, (selectError, rows) => {
            if (selectError) {
                console.error("Find report before delete error:", selectError);
                return res.status(500).json({ message: "Could not find report." });
            }
            if (!rows.length) {
                return res.status(404).json({ message: "Report not found or cannot be deleted." });
            }

            db.query(
                isStudent
                    ? "DELETE FROM items WHERE id = ? AND user_id = ? AND status IN ('Active', 'Expired')"
                    : "DELETE FROM items WHERE id = ?",
                values,
                (deleteError) => {
                    if (deleteError) {
                        console.error("Delete report database error:", deleteError);
                        return res.status(500).json({ message: "Could not delete report." });
                    }
                    removeStoredImage(rows[0].image_path);
                    res.json({ message: "Report deleted successfully." });
                }
            );
        });
    }
);

app.use((err, req, res, next) => {
    console.error("Server error:", err);

    if (res.headersSent) {
        return next(err);
    }

    res.status(500).json({
        message: "Something went wrong on the server."
    });
});

app.listen(PORT, () => {
    console.log(`CampusLoop server running on port ${PORT}`);
});