const ERROR_MAP = {
  auth_required: { status: 401, error: "auth_required" },
  permission_denied: { status: 403, error: "permission_denied" },
  not_found: { status: 404, error: "not_found" },
  validation_failed: { status: 400, error: "validation_failed" },
  config_conflict: { status: 409, error: "config_conflict" },
  invalid_state: { status: 409, error: "invalid_state" },
  structure_locked: { status: 409, error: "structure_locked" },
  external_member_exists: { status: 409, error: "external_member_exists" },
  creator_cannot_leave: { status: 409, error: "creator_cannot_leave" },
  member_protected: { status: 409, error: "member_protected" },
  removal_blocked: { status: 409, error: "removal_blocked" },
  payment_required: { status: 402, error: "payment_required" },
  commercial_participant_limit_reached: {
    status: 409,
    error: "commercial_participant_limit_reached",
  },
  join_requires_group: {
    status: 403,
    error: "join_requires_group",
  },
};

function mapHttpFunctionError(error) {
  return ERROR_MAP[error?.message] || { status: 500, error: error?.message || "internal" };
}

module.exports = {
  ERROR_MAP,
  mapHttpFunctionError,
};
