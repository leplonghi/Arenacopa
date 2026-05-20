const { DEFAULT_SITE_URL } = require("./constants");
const { mapHttpFunctionError } = require("./error-map");

function getAllowedOrigins(configuredSiteUrl = DEFAULT_SITE_URL) {
    const configuredOrigin = configuredSiteUrl.replace(/\/$/, "");
    return new Set([
        configuredOrigin,
        "https://arenacopa-web-2026.web.app",
        "https://arenacup.net",
        "http://localhost",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
        "capacitor://localhost",
    ]);
}

function isLocalDevOrigin(origin) {
    return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
}

function applyCors(req, res) {
    const origin = typeof req?.headers?.origin === "string" ? req.headers.origin.replace(/\/$/, "") : null;
    const siteUrl = process.env.SITE_URL || DEFAULT_SITE_URL;
    const allowedOrigins = getAllowedOrigins(siteUrl);

    if (origin && (allowedOrigins.has(origin) || isLocalDevOrigin(origin))) {
        res.set("Access-Control-Allow-Origin", origin);
        res.set("Vary", "Origin");
    }
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
}

/**
 * Higher-order function to create a standard ArenaCup HTTP function.
 * Handles CORS, Authentication check, and Error mapping.
 */
function createHttpFunction(handler, options = { requireAuth: true }) {
    const functions = require("firebase-functions/v1");
    return functions.region("us-central1").https.onRequest(async (req, res) => {
        applyCors(req, res);

        if (req.method === "OPTIONS") {
            res.status(204).send("");
            return;
        }

        try {
            let actorId = null;
            if (options.requireAuth) {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    throw new Error("auth_required");
                }
                const token = authHeader.split("Bearer ")[1];
                const decodedToken = await require("firebase-admin").auth().verifyIdToken(token);
                actorId = decodedToken.uid;
            }

            const result = await handler({
                req,
                res,
                actorId,
                payload: req.body || {},
                db: require("firebase-admin").firestore(),
            });

            if (!res.headersSent) {
                res.status(200).json(result || { success: true });
            }
        } catch (error) {
            console.error("Function error:", error.message, error.stack);
            
            const mapped = mapHttpFunctionError(error);
            if (!res.headersSent) {
                res.status(mapped.status).json({ error: mapped.error });
            }
        }
    });
}

module.exports = {
    applyCors,
    createHttpFunction,
    mapHttpFunctionError,
};
