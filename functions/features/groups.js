const { createHttpFunction } = require("../shared/middleware");
const groupAccessRepository = require("../group-access/repository");

exports.updateGroupSettings = createHttpFunction(async ({ actorId, payload, db }) => {
    const updated = await groupAccessRepository.updateGroupSettings({
        db,
        groupId: payload.group_id,
        actorId,
        patch: payload.patch || {},
        nowIso: new Date().toISOString(),
    });

    return {
        group_id: updated.id,
        ...updated,
    };
});

exports.requestGroupJoin = createHttpFunction(async ({ actorId, payload, db }) => {
    const result = await groupAccessRepository.requestGroupJoin({
        db,
        groupId: payload.group_id,
        actorId,
        nowIso: new Date().toISOString(),
        inviteCode: payload.invite_code || null,
        origin: payload.origin || "group_request",
    });

    return {
        group_id: result.group?.id || payload.group_id,
        ...result,
    };
});

exports.approveGroupJoin = createHttpFunction(async ({ actorId, payload, db }) => {
    return groupAccessRepository.approveGroupJoin({
        db,
        groupId: payload.group_id,
        requestId: payload.request_id,
        actorId,
        nowIso: new Date().toISOString(),
        reasonCode: payload.reason_code || null,
    });
});

exports.rejectGroupJoin = createHttpFunction(async ({ actorId, payload, db }) => {
    return groupAccessRepository.rejectGroupJoin({
        db,
        groupId: payload.group_id,
        requestId: payload.request_id,
        actorId,
        nowIso: new Date().toISOString(),
        reasonCode: payload.reason_code || null,
    });
});

exports.leaveGroup = createHttpFunction(async ({ actorId, payload, db }) => {
    return groupAccessRepository.leaveGroup({
        db,
        groupId: payload.group_id,
        actorId,
        nowIso: new Date().toISOString(),
    });
});

exports.removeGroupMember = createHttpFunction(async ({ actorId, payload, db }) => {
    return groupAccessRepository.removeGroupMember({
        db,
        groupId: payload.group_id,
        memberId: payload.member_id,
        actorId,
        nowIso: new Date().toISOString(),
        reasonCode: payload.reason_code || null,
    });
});

exports.setFeaturedGroupBolao = createHttpFunction(async ({ actorId, payload, db }) => {
    return groupAccessRepository.setFeaturedGroupBolao({
        db,
        groupId: payload.group_id,
        bolaoId: payload.bolao_id || null,
        actorId,
        nowIso: new Date().toISOString(),
    });
});
