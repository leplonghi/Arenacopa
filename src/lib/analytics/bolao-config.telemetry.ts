export type BolaoConfigEvent =
  | "draft_created"
  | "creation_step_completed"
  | "creation_abandoned"
  | "pool_published"
  | "time_to_publish"
  | "edit_blocked"
  | "field_repeatedly_blocked"
  | "pool_duplicated_after_lock"
  | "join_denied_policy"
  | "join_denied_group_requirement"
  | "member_removal_blocked"
  | "editable_sections_recomputed";

export function trackBolaoConfigEvent(
  event: BolaoConfigEvent,
  props: Record<string, unknown> = {},
) {
  if (typeof window !== "undefined" && typeof window.plausible === "function") {
    window.plausible(event, { props });
  }
}
