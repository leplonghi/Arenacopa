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

exports.resolvePublicInvite = createHttpFunction(async ({ payload, db }) => {
    const inviteCode = typeof payload.inviteCode === "string" ? payload.inviteCode.trim().toUpperCase() : "";
    const kind = payload.kind; // "bolao" or "group"
    
    if (!inviteCode) {
        throw new Error("validation_failed");
    }

    // If kind is bolao or unspecified, check boloes
    if (kind === "bolao" || !kind) {
        const bolaoSnapshot = await db.collection("boloes").where("invite_code", "==", inviteCode).limit(1).get();
        if (!bolaoSnapshot.empty) {
            const { normalizeBolaoDocument } = require("../bolao-config/handlers");
            const bolaoData = bolaoSnapshot.docs[0].data();
            const normalized = normalizeBolaoDocument({ id: bolaoSnapshot.docs[0].id, ...bolaoData });
            
            if (normalized.status !== "deleted") {
                const bolaoPayload = {
                    id: normalized.id,
                    name: normalized.name,
                    description: normalized.description,
                    avatar_url: normalized.avatar_url,
                    category: normalized.category,
                    is_paid: normalized.is_paid,
                    memberCount: normalized.member_count || 0,
                    visibility: normalized.access_policy?.visibility,
                    admission_mode: normalized.access_policy?.admission_mode,
                    join_mode: normalized.access_policy?.join_mode,
                    group_binding_mode: normalized.context?.group_binding_mode,
                    grupo_id: normalized.grupo_id,
                    required_group_id: normalized.context?.grupo_id,
                    required_group_invite_code: null,
                    can_join_direct: normalized.access_policy?.admission_mode === "direct_open" || (normalized.access_policy?.admission_mode === "direct_code_or_invite"),
                };

                if (normalized.context?.group_binding_mode === "group_gated" && normalized.context?.grupo_id) {
                    const groupSnap = await db.collection("grupos").doc(normalized.context.grupo_id).get();
                    if (groupSnap.exists) {
                        bolaoPayload.required_group_invite_code = groupSnap.data().invite_code || null;
                    }
                }

                return {
                    found: true,
                    data: bolaoPayload
                };
            }
        }
    }

    // If kind is group or unspecified (and not found as bolao), check groups
    if (kind === "group" || !kind) {
        const groupSnapshot = await db.collection("grupos").where("invite_code", "==", inviteCode).limit(1).get();
        if (!groupSnapshot.empty) {
            const { normalizeGroupDocument } = require("../group-access/contract");
            const groupData = groupSnapshot.docs[0].data();
            const normalized = normalizeGroupDocument({ id: groupSnapshot.docs[0].id, ...groupData });
            
            return {
                found: true,
                data: {
                    id: normalized.id,
                    name: normalized.name,
                    description: normalized.description,
                    emoji: normalized.emoji,
                    category: normalized.category,
                    memberCount: groupData.member_count || 0,
                    visibility: normalized.visibility,
                    admission_mode: normalized.admission_mode,
                    featured_bolao_id: normalized.featured_bolao_id,
                    objective: normalized.objective,
                    can_join_direct: normalized.admission_mode === "direct_open" || normalized.admission_mode === "direct_code_or_invite",
                }
            };
        }
    }

    throw new Error("not_found");
}, { requireAuth: false });
