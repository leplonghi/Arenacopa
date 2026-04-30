const { createHttpFunction } = require("../shared/middleware");
const bolaoConfigHandlers = require("../bolao-config/handlers");
const bolaoConfigRepository = require("../bolao-config/repository");
const bolaoListingRepository = require("../bolao-listing/repository");
const groupAccessRepository = require("../group-access/repository");
const { saveExclusiveBolaoPalpite } = require("../bolao-exclusive/palpites");
const { updateBolaoPrizeSettings } = require("../bolao-prize/settings");

exports.createBolaoDraft = createHttpFunction(async ({ actorId, payload, db }) => {
    const bolaoRef = db.collection("boloes").doc();
    const nowIso = new Date().toISOString();
    
    const draftPayload = bolaoConfigHandlers.buildDraftBolaoDocument({
        bolaoId: bolaoRef.id,
        actorId,
        nowIso,
        input: payload || {},
    });

    const created = await bolaoConfigRepository.createDraft({
        db,
        bolaoId: bolaoRef.id,
        payload: draftPayload,
    });

    return {
        bolao_id: bolaoRef.id,
        ...created,
    };
});

exports.createAndPublishBolao = createHttpFunction(async ({ actorId, payload, db }) => {
    let grupoId = payload.context?.grupo_id || null;
    const groupCreation = payload.group_creation || null;
    const nowIso = new Date().toISOString();

    let groupPromise = Promise.resolve(null);
    if (groupCreation) {
        const groupRef = db.collection("grupos").doc();
        grupoId = groupRef.id;
        groupPromise = groupAccessRepository.createGroup({
            db,
            groupId: groupRef.id,
            actorId,
            payload: groupCreation,
            nowIso,
        });
    }

    const bolaoRef = db.collection("boloes").doc();
    const draftPayload = bolaoConfigHandlers.buildDraftBolaoDocument({
        bolaoId: bolaoRef.id,
        actorId,
        nowIso,
        input: {
            ...payload,
            context: {
                ...(payload.context || {}),
                grupo_id: grupoId,
            },
        },
    });

    await groupPromise;

    const created = await bolaoConfigRepository.createDraft({
        db,
        bolaoId: bolaoRef.id,
        payload: draftPayload,
    });

    const published = await bolaoConfigRepository.publishBolao({
        db,
        bolaoId: bolaoRef.id,
        actorId,
        expectedConfigVersion: Number(created.integrity?.config_version || 1),
        nowIso,
    });

    return {
        bolao_id: bolaoRef.id,
        ...published,
    };
});

exports.updateBolaoConfiguration = createHttpFunction(async ({ actorId, payload, db }) => {
    const updated = await bolaoConfigRepository.updateConfiguration({
        db,
        bolaoId: payload.bolao_id,
        actorId,
        expectedConfigVersion: Number(payload.expected_config_version),
        patch: payload.patch || {},
        nowIso: new Date().toISOString(),
        forceEdit: Boolean(payload.force_edit),
    });

    return {
        bolao_id: updated.id,
        ...updated,
    };
});

exports.publishBolao = createHttpFunction(async ({ actorId, payload, db }) => {
    const updated = await bolaoConfigRepository.publishBolao({
        db,
        bolaoId: payload.bolao_id,
        actorId,
        expectedConfigVersion: Number(payload.expected_config_version),
        nowIso: new Date().toISOString(),
    });

    return {
        bolao_id: updated.id,
        ...updated,
    };
});

exports.duplicateBolao = createHttpFunction(async ({ actorId, payload, db }) => {
    const duplicated = await bolaoConfigRepository.duplicateBolao({
        db,
        sourceBolaoId: payload.source_bolao_id,
        actorId,
        nowIso: new Date().toISOString(),
        origin: payload.origin || "published_snapshot",
        overrides: payload.overrides || {},
    });

    return {
        bolao_id: duplicated.id,
        ...duplicated,
    };
});

exports.alterBolaoPresentation = createHttpFunction(async ({ actorId, payload, db }) => {
    const updated = await bolaoConfigRepository.alterPresentation({
        db,
        bolaoId: payload.bolao_id,
        actorId,
        patch: payload.patch || {},
        nowIso: new Date().toISOString(),
    });

    return {
        bolao_id: updated.id,
        ...updated,
    };
});

exports.finishBolao = createHttpFunction(async ({ actorId, payload, db }) => {
    const updated = await bolaoConfigRepository.finishBolao({
        db,
        bolaoId: payload.bolao_id,
        actorId,
        nowIso: new Date().toISOString(),
        reason: payload.reason || null,
    });

    return {
        bolao_id: updated.id,
        ...updated,
    };
});

exports.archiveBolao = createHttpFunction(async ({ actorId, payload, db }) => {
    const updated = await bolaoConfigRepository.archiveBolao({
        db,
        bolaoId: payload.bolao_id,
        actorId,
        nowIso: new Date().toISOString(),
        reason: payload.reason || null,
    });

    return {
        bolao_id: updated.id,
        ...updated,
    };
});

exports.deleteBolao = createHttpFunction(async ({ actorId, payload, db }) => {
    const updated = await bolaoConfigRepository.deleteBolao({
        db,
        bolaoId: payload.bolao_id,
        actorId,
        nowIso: new Date().toISOString(),
        reason: payload.reason || null,
    });

    return {
        bolao_id: updated.id,
        ...updated,
    };
});

exports.leaveBolao = createHttpFunction(async ({ actorId, payload, db }) => {
    return bolaoConfigRepository.leaveBolao({
        db,
        bolaoId: payload.bolao_id,
        actorId,
        nowIso: new Date().toISOString(),
    });
});

exports.saveExclusiveBolaoPalpite = createHttpFunction(async ({ actorId, payload, db }) => {
    return saveExclusiveBolaoPalpite({
        db,
        admin: require("firebase-admin"),
        actorId,
        input: payload || {},
        nowIso: new Date().toISOString(),
    });
});

exports.updateBolaoPrizeSettings = createHttpFunction(async ({ actorId, payload, db }) => {
    return updateBolaoPrizeSettings({
        db,
        actorId,
        input: payload || {},
        nowIso: new Date().toISOString(),
    });
});

exports.listUserBoloes = createHttpFunction(async ({ actorId, db }) => {
    return bolaoListingRepository.listUserBoloes({
        db,
        actorId,
    });
});
