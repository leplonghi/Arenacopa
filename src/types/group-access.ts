export type GroupVisibility = "private" | "public";
export type GroupAdmissionMode = "approval" | "direct_code_or_invite" | "direct_open";
export type JoinRequestStatus = "pending" | "approved" | "rejected" | "expired" | "cancelled";
export type MembershipStatus = "pending" | "active" | "rejected" | "left" | "removed";

export type GroupSummary = {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  visibility: GroupVisibility;
  admissionMode: GroupAdmissionMode;
  category: "private" | "public";
  featuredBolaoId: string | null;
  objective: string;
  inviteCode: string;
};

export type GroupJoinResult = {
  groupId: string;
  status: "joined" | "requested" | "already_member";
  membershipStatus?: MembershipStatus;
  requestId?: string;
  requestStatus?: JoinRequestStatus;
  group?: GroupSummary;
};

export type BolaoJoinResult = {
  bolaoId: string;
  status: "joined" | "requested" | "already_member";
  membershipStatus?: MembershipStatus;
  requestId?: string;
  requestStatus?: JoinRequestStatus;
  requiredGroupId?: string | null;
};

export type CreateGroupPayload = {
  presentation: {
    name: string;
    description?: string;
    emoji?: string;
    objective?: string;
  };
  visibility: GroupVisibility;
  admission_mode: GroupAdmissionMode;
};

export type UpdateGroupSettingsPayload = {
  group_id: string;
  patch: Partial<{
    name: string;
    description: string;
    emoji: string;
    objective: string;
    visibility: GroupVisibility;
    admission_mode: GroupAdmissionMode;
    featured_bolao_id: string | null;
  }>;
};
