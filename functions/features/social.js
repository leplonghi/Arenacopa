const { createHttpFunction } = require("../shared/middleware");
const groupAccessRepository = require("../group-access/repository");

exports.requestBolaoJoin = createHttpFunction(async ({ actorId, payload, db }) => {
    const result = await groupAccessRepository.requestBolaoJoin({
        db,
        bolaoId: payload.bolao_id,
        actorId,
        nowIso: new Date().toISOString(),
        inviteCode: payload.invite_code || null,
        origin: payload.origin || "pool_request",
    });

    return {
        bolao_id: result.bolao?.id || payload.bolao_id,
        ...result,
    };
});

exports.approveBolaoJoin = createHttpFunction(async ({ actorId, payload, db }) => {
    return groupAccessRepository.approveBolaoJoin({
        db,
        bolaoId: payload.bolao_id,
        requestId: payload.request_id,
        actorId,
        nowIso: new Date().toISOString(),
        reasonCode: payload.reason_code || null,
    });
});

exports.rejectBolaoJoin = createHttpFunction(async ({ actorId, payload, db }) => {
    return groupAccessRepository.rejectBolaoJoin({
        db,
        bolaoId: payload.bolao_id,
        requestId: payload.request_id,
        actorId,
        nowIso: new Date().toISOString(),
        reasonCode: payload.reason_code || null,
    });
});

exports.joinViaInvite = createHttpFunction(async ({ actorId, payload, db }) => {
    const inviteCode = typeof payload.invite_code === "string" ? payload.invite_code.trim().toUpperCase() : "";
    const kind = payload.kind;
    if (!inviteCode || !["group", "bolao"].includes(kind)) {
        throw new Error("validation_failed");
    }

    if (kind === "group") {
        const groupSnapshot = await db.collection("grupos").where("invite_code", "==", inviteCode).limit(1).get();
        if (groupSnapshot.empty) {
            throw new Error("not_found");
        }
        const result = await groupAccessRepository.requestGroupJoin({
            db,
            groupId: groupSnapshot.docs[0].id,
            actorId,
            nowIso: new Date().toISOString(),
            inviteCode,
            origin: "invite_link",
        });
        return {
            group_id: groupSnapshot.docs[0].id,
            ...result,
        };
    }

    const bolaoSnapshot = await db.collection("boloes").where("invite_code", "==", inviteCode).limit(1).get();
    if (bolaoSnapshot.empty) {
        throw new Error("not_found");
    }
    const bolaoData = bolaoSnapshot.docs[0].data();
    if (bolaoData.lifecycle?.status === "deleted" || bolaoData.status === "deleted") {
        throw new Error("not_found");
    }

    const result = await groupAccessRepository.requestBolaoJoin({
        db,
        bolaoId: bolaoSnapshot.docs[0].id,
        actorId,
        nowIso: new Date().toISOString(),
        inviteCode,
        origin: "invite_link",
    });
    return {
        bolao_id: bolaoSnapshot.docs[0].id,
        ...result,
    };
});
