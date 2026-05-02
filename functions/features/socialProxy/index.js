const functions = require("firebase-functions");
const admin = require("firebase-admin");
const isbot = require("isbot");
const fs = require("fs");
const path = require("path");

// Load the index.html file once
let indexHtml = null;

exports.socialProxy = functions.region("us-central1").https.onRequest(async (req, res) => {
    try {
        const userAgent = req.headers["user-agent"];
        
        const siteUrl = "https://arenacopa.com"; // ou pegue da config
        
        // Fetch index.html via HTTP
        if (!indexHtml) {
            try {
                // Fetch the static index.html which is not intercepted by this rewrite
                const resp = await fetch(`${siteUrl}/index.html`);
                if (resp.ok) {
                    indexHtml = await resp.text();
                } else {
                    return res.status(500).send("Could not fetch index.html");
                }
            } catch (err) {
                console.error("Fetch index.html error:", err);
                return res.status(500).send("Could not fetch index.html");
            }
        }

        // Se NÃO for um bot, devolve o index.html original
        if (!isbot(userAgent)) {
            return res.status(200).send(indexHtml);
        }

        // --- Se FOR UM BOT, injeta as meta tags ---
        const db = admin.firestore();
        let title = "Arena CUP — World Cup 2026";
        let description = "Acompanhe a Copa 2026, crie bolões e concorra com seus amigos.";
        let image = `${siteUrl}/og-image.png`;

        const urlPath = req.path; // ex: /boloes/entrar/XYZ123
        const pathParts = urlPath.split("/").filter(Boolean);

        // Verifica se é /boloes/entrar/:code ou /grupos/entrar/:code
        if (pathParts.length >= 3 && pathParts[1] === "entrar") {
            const type = pathParts[0]; // "boloes" ou "grupos"
            const inviteCode = pathParts[2].toUpperCase();

            if (type === "boloes") {
                const snapshot = await db.collection("boloes")
                    .where("invite_code", "==", inviteCode)
                    .limit(1)
                    .get();

                if (!snapshot.empty) {
                    const data = snapshot.docs[0].data();
                    title = `Participe do Bolão: ${data.name}`;
                    description = data.description || "Faça seus palpites e mostre quem sabe mais de futebol!";
                    if (data.avatar_url) image = data.avatar_url;
                }
            } else if (type === "grupos") {
                const snapshot = await db.collection("grupos")
                    .where("invite_code", "==", inviteCode)
                    .limit(1)
                    .get();

                if (!snapshot.empty) {
                    const data = snapshot.docs[0].data();
                    title = `Comunidade ${data.name} ${data.emoji || ""}`;
                    description = data.description || "Entre na comunidade para jogar com a gente!";
                }
            }
        }

        // Substitui no HTML original
        let modifiedHtml = indexHtml
            .replace(
                /<meta property="og:title" content="[^"]*" \/>/g,
                `<meta property="og:title" content="${title}" />`
            )
            .replace(
                /<meta property="og:description" content="[^"]*" \/>/g,
                `<meta property="og:description" content="${description}" />`
            )
            .replace(
                /<meta property="og:image" content="[^"]*" \/>/g,
                `<meta property="og:image" content="${image}" />`
            );

        res.set("Cache-Control", "public, max-age=300, s-maxage=600");
        return res.status(200).send(modifiedHtml);

    } catch (error) {
        console.error("Erro no socialProxy:", error);
        if (indexHtml) {
            return res.status(200).send(indexHtml); // Fallback para normal
        }
        return res.status(500).send("Erro interno");
    }
});
