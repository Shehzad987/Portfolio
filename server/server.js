
/**
 * Portfolio backend — contact form API
 *
 * POST /api/contact   saves a message to MongoDB and sends an email notification
 * GET  /api/health    shows whether the database is connected
 *
 * Run locally: npm run dev
 */
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");

const Message = require("./models/Message");

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Gmail transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Render runs behind a proxy.
if (IS_PRODUCTION) {
    app.set("trust proxy", 1);
}

/* =========================================================
   DATABASE HELPERS
========================================================= */

// MongoDB database names cannot contain these characters.
const INVALID_DB_NAME_CHARS = /[\/\\."$\x00]/;

function validateDatabaseName(name) {
    if (!name) return { valid: true };

    if (name.length > 63) {
        return {
            valid: false,
            reason: "is longer than 63 characters"
        };
    }

    const match = name.match(INVALID_DB_NAME_CHARS);

    if (match) {
        return {
            valid: false,
            reason: `contains the character ${match[0]}`
        };
    }

    return { valid: true };
}

function describeDatabaseError(error) {
    const name = error && error.name;
    const code = error && error.code;
    const errorText = String((error && error.message) || "");

    if (name === "ValidationError" && error.errors) {
        return {
            status: 400,
            hint: Object.values(error.errors)
                .map((e) => e.message)
                .join(" ")
        };
    }

    if (
        code === 13 ||
        (error && error.codeName === "Unauthorized") ||
        /not authorized/i.test(errorText)
    ) {
        return {
            status: 503,
            hint:
                "The database user is not allowed to write to this database. " +
                "Open MongoDB Atlas Database Access and give your user readWrite permission."
        };
    }

    if (
        code === 73 ||
        (error && error.codeName === "InvalidNamespace") ||
        /invalid (database name|namespace)/i.test(errorText)
    ) {
        return {
            status: 500,
            hint:
                `MongoDB rejected the database name "${mongoose.connection.name}". ` +
                'Check DB_NAME in your .env file. Avoid / \\ . " $ and null characters.'
        };
    }

    if (code === 18 || /bad auth|authentication failed/i.test(errorText)) {
        return {
            status: 503,
            hint:
                "MongoDB rejected the username or password in MONGODB_URI. " +
                "Special characters in the password may need URL encoding."
        };
    }

    if (
        name === "MongoServerSelectionError" ||
        name === "MongoNetworkError" ||
        name === "MongoNotConnectedError" ||
        /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|buffering timed out|timed out/i.test(errorText)
    ) {
        return {
            status: 503,
            hint:
                "Cannot reach MongoDB. Check your Atlas Network Access settings " +
                "and your internet connection."
        };
    }

    return {
        status: 500,
        hint: null
    };
}

const PUBLIC_MESSAGES = {
    400: "Please check your details and try again.",
    500: "Something went wrong. Please try again.",
    503: "Messages cannot be saved right now. Please try again later."
};

function fatal(message) {
    console.error(`\n❌ ${message}\n`);
    process.exit(1);
}

/* =========================================================
   MIDDLEWARE
========================================================= */

// Log incoming requests.
app.use((req, res, next) => {
    console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ` +
        `(origin: ${req.headers.origin || "none"})`
    );

    next();
});

// Allowed frontend origins.
const normalizeOrigin = (value) =>
    String(value).trim().replace(/\/+$/, "");

const allowedOrigins = new Set([
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    ...String(process.env.FRONTEND_URL || "")
        .split(",")
        .map(normalizeOrigin)
        .filter(Boolean)
]);

const LOCAL_ORIGIN =
    /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/;

app.use(cors({
    origin(origin, callback) {
        // Allow requests without an Origin header (e.g. Postman).
        if (!origin) {
            return callback(null, true);
        }

        const requested = normalizeOrigin(origin);

        const isLocalDevelopment =
            !IS_PRODUCTION && LOCAL_ORIGIN.test(requested);

        if (allowedOrigins.has(requested) || isLocalDevelopment) {
            return callback(null, true);
        }

        console.error(`CORS blocked origin: ${origin}`);

        if (origin === "null") {
            console.error(
                'Open your website using VS Code "Live Server", not file://.'
            );
        } else {
            console.error(
                `Add ${requested} to FRONTEND_URL in your .env file.`
            );
        }

        const error = new Error("Not allowed by CORS");
        error.status = 403;

        return callback(error);
    }
}));

app.use(express.json({ limit: "10kb" }));

// Contact form rate limiter.
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: IS_PRODUCTION ? 5 : 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please try again after 15 minutes."
    }
});

/* =========================================================
   ROUTES
========================================================= */

// Backend home route.
app.get("/", (req, res) => {
    res.status(200).send("Portfolio backend is running!");
});

// Database health-check route.
app.get("/api/health", (req, res) => {
    const connected = mongoose.connection.readyState === 1;

    res.status(connected ? 200 : 503).json({
        success: connected,
        server: "running",
        database: connected
            ? `connected (${mongoose.connection.name})`
            : "not connected"
    });
});

/* =========================================================
   CONTACT FORM + EMAIL NOTIFICATION
========================================================= */

app.post("/api/contact", contactLimiter, async (req, res) => {
    const { name, subject, email, message } = req.body || {};

    // 1. Check required fields.
    if (!name || !subject || !email || !message) {
        return res.status(400).json({
            success: false,
            message: "Please fill in all fields."
        });
    }

    // 2. Clean submitted data.
    const cleanData = {
        name: String(name).trim(),
        subject: String(subject).trim(),
        email: String(email).trim().toLowerCase(),
        message: String(message).trim()
    };

    if (
        !cleanData.name ||
        !cleanData.subject ||
        !cleanData.email ||
        !cleanData.message
    ) {
        return res.status(400).json({
            success: false,
            message: "All fields are required."
        });
    }

    // 3. Check field lengths.
    if (
        cleanData.name.length > 100 ||
        cleanData.subject.length > 150 ||
        cleanData.email.length > 254 ||
        cleanData.message.length > 5000
    ) {
        return res.status(400).json({
            success: false,
            message: "One or more fields are too long."
        });
    }

    // 4. Validate email format.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanData.email)) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid email."
        });
    }

    // 5. Save message to MongoDB.
    try {
        if (mongoose.connection.readyState !== 1) {
            const notConnected = new Error("MongoDB is not connected.");
            notConnected.name = "MongoNotConnectedError";
            throw notConnected;
        }

        await Message.create(cleanData);

        console.log(
            `Message from ${cleanData.email} saved to ` +
            `${mongoose.connection.name} > Messages`
        );

        // 6. Send Gmail notification.
        // Email failure will not delete or lose the saved MongoDB message.
        console.log("========== EMAIL CONFIG CHECK ==========");
        console.log("EMAIL_USER exists:", Boolean(process.env.EMAIL_USER));
        console.log("EMAIL_PASS exists:", Boolean(process.env.EMAIL_PASS));
        console.log("NOTIFICATION_EMAIL exists:", Boolean(process.env.NOTIFICATION_EMAIL));
        console.log("========================================");
        try {
            if (
                !process.env.EMAIL_USER ||
                !process.env.EMAIL_PASS ||
                !process.env.NOTIFICATION_EMAIL
            ) {
                throw new Error(
                    "Email settings are missing. Configure EMAIL_USER, " +
                    "EMAIL_PASS, and NOTIFICATION_EMAIL."
                );
            }

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: process.env.NOTIFICATION_EMAIL,
                replyTo: cleanData.email,
                subject: `New Portfolio Contact: ${cleanData.subject}`,

                text: [
                    "You have received a new message through your portfolio website.",
                    "",
                    `Name: ${cleanData.name}`,
                    `Email: ${cleanData.email}`,
                    `Subject: ${cleanData.subject}`,
                    "",
                    "Message:",
                    cleanData.message
                ].join("\n")
            });

            console.log("✅ Email notification sent successfully!");

        } catch (emailError) {
            console.error(
                "❌ Email notification failed:",
                emailError.message
            );
        }

        // 7. Send success response to frontend.
        return res.status(201).json({
            success: true,
            message: "Your message has been sent successfully!"
        });

    } catch (error) {
        const { status, hint } = describeDatabaseError(error);

        console.error("\n========== CONTACT FORM ERROR ==========");
        console.error("Error name:", error.name);
        console.error("Error code:", error.code, error.codeName || "");
        console.error("Error message:", error.message);

        if (hint) {
            console.error("How to fix:", hint);
        }

        console.error("========================================\n");

        const visibleMessage = IS_PRODUCTION
            ? PUBLIC_MESSAGES[status] || PUBLIC_MESSAGES[500]
            : hint || PUBLIC_MESSAGES[status] || PUBLIC_MESSAGES[500];

        return res.status(status).json({
            success: false,
            message: visibleMessage
        });
    }
});

/* =========================================================
   ERROR HANDLING
========================================================= */

// Unknown routes.
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found."
    });
});

// Handle CORS, JSON, and other errors.
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({
            success: false,
            message: "This website is not allowed to use this API."
        });
    }

    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            message: "Invalid request data."
        });
    }

    if (err.type === "entity.too.large") {
        return res.status(413).json({
            success: false,
            message: "Your message is too large."
        });
    }

    console.error("Unhandled error:", err);

    return res.status(500).json({
        success: false,
        message: PUBLIC_MESSAGES[500]
    });
});

/* =========================================================
   SERVER START-UP
========================================================= */

mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected.");
});

mongoose.connection.on("reconnected", () => {
    console.log("✅ MongoDB reconnected.");
});

async function verifyDatabaseAccess() {
    try {
        await Message.findOne().select("_id").lean();

        console.log("✅ Database access check passed.");

    } catch (error) {
        const { hint } = describeDatabaseError(error);

        console.warn(
            "⚠️ Database access check failed:",
            hint || error.message
        );
    }
}

async function startServer() {
    const uri = process.env.MONGODB_URI;
    const dbName = (process.env.DB_NAME || "").trim();

    if (!uri) {
        fatal("MONGODB_URI is missing. Add it to your .env file.");
    }

    // Validate database name.
    const nameCheck = validateDatabaseName(dbName);

    if (!nameCheck.valid) {
        fatal(
            `DB_NAME="${dbName}" ${nameCheck.reason}.\n` +
            'MongoDB database names cannot contain / \\ . " $ or a null character.'
        );
    }

    try {
        console.log("Connecting to MongoDB...");

        await mongoose.connect(uri, {
            dbName: dbName || undefined,
            serverSelectionTimeoutMS: 10000
        });

        console.log("MongoDB connected successfully!");
        console.log("Database:", mongoose.connection.name);

    } catch (error) {
        const { hint } = describeDatabaseError(error);

        console.error("\n❌ MongoDB connection failed!");

        if (hint) {
            console.error("How to fix:", hint);
        }

        console.error(error);

        process.exit(1);
    }

    await verifyDatabaseAccess();

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`);
        console.log("Waiting for contact form submissions...");
    });
}

// Start server only when this file is run directly.
if (require.main === module) {
    startServer();
}

module.exports = {
    app,
    validateDatabaseName,
    describeDatabaseError,
    startServer
};
