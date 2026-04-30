const functions = require("firebase-functions");
const { DEFAULT_SITE_URL } = require("./constants");

function getAllowedOrigins(configuredSiteUrl = DEFAULT_SITE_URL) {
    const configuredOrigin = configuredSiteUrl.replace(/\/$/, "");
    return new Set([
        configuredOrigin,
        "https://arenacopa-web-2026.web.app",
        "https://arenacup.net",
        "http://localhost",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        "capacitor://localhost",
    ]);
}

function applyCors(req, res) {
    const origin = typeof req?.headers?.origin === "string" ? req.headers.origin.replace(/\/$/, "") : null;
    const runtimeConfig = functions.config();
    const siteUrl = runtimeConfig?.app?.site_url || process.env.SITE_URL || DEFAULT_SITE_URL;
    const allowedOrigins = getAllowedOrigins(siteUrl);

    if (origin && allowedOrigins.has(origin)) {
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
            
            const errorMap = {
                "auth_required": { status: 401, error: "auth_required" },
                "permission_denied": { status: 403, error: "permission_denied" },
                "not_found": { status: 404, error: "not_found" },
                "validation_failed": { status: 400, error: "validation_failed" },
            };

            const mapped = errorMap[error.message] || { status: 500, error: error.message || "internal" };
            if (!res.headersSent) {
                res.status(mapped.status).json({ error: mapped.error });
            }
        }
    });
}

module.exports = {
    createHttpFunction,
};
