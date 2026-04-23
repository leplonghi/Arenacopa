function isExternalParticipant({ poolOwnerId, member }) {
  return Boolean(
    member &&
      member.user_id !== poolOwnerId &&
      member.membership_status === "active",
  );
}

function hasValidPublicExpectation({
  lifecycleStatus,
  accessPolicy,
  acceptedInviteCount,
  approvedRequestCount,
  reservedSeatCount,
}) {
  if (!["published", "live"].includes(lifecycleStatus)) {
    return false;
  }

  if (accessPolicy?.join_mode === "public_open") {
    return true;
  }

  return (
    Number(acceptedInviteCount || 0) > 0 ||
    Number(approvedRequestCount || 0) > 0 ||
    Number(reservedSeatCount || 0) > 0
  );
}

function computeEditableSections({
  lifecycleStatus,
  isStructureLocked,
  hasExternalParticipant,
  hasValidPublicExpectation: publicExpectation,
}) {
  const isDraft = lifecycleStatus === "draft";
  const participationEditable =
    !isStructureLocked && !hasExternalParticipant && !publicExpectation;

  return {
    presentation: true,
    context: isDraft || participationEditable,
    access_policy: isDraft || participationEditable,
    competition_rules: isDraft,
    finance_rules: isDraft,
    operation: true,
  };
}

function getCompetitiveEligibility({
  membershipStatus,
  lifecycleStatus,
}) {
  return (
    membershipStatus === "active" &&
    ["published", "live", "finished"].includes(lifecycleStatus)
  );
}

function getFinancialEligibility({ paymentStatus }) {
  return ["confirmed", "waived", "paid", "exempt"].includes(
    String(paymentStatus || ""),
  );
}

function canRemoveMember({
  lifecycleStatus,
  memberHasPrediction,
  paymentStatus,
}) {
  if (lifecycleStatus === "draft") {
    return { allowed: true, nextStatus: "removed" };
  }

  if (["live", "finished", "archived"].includes(lifecycleStatus)) {
    return { allowed: false, code: "removal_blocked" };
  }

  if (
    memberHasPrediction ||
    ["confirmed", "paid"].includes(String(paymentStatus || ""))
  ) {
    return { allowed: false, code: "member_protected" };
  }

  return { allowed: true, nextStatus: "withdrawn_by_owner" };
}

module.exports = {
  canRemoveMember,
  computeEditableSections,
  getCompetitiveEligibility,
  getFinancialEligibility,
  hasValidPublicExpectation,
  isExternalParticipant,
};
