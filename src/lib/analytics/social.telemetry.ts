type SocialTelemetryEvent =
  | "group_create_started"
  | "group_create_completed"
  | "pool_create_started"
  | "pool_create_completed"
  | "step_abandoned"
  | "join_cta_viewed"
  | "join_requested"
  | "join_direct_success"
  | "approval_completed"
  | "approval_latency"
  | "edit_blocked_after_lock"
  | "duplicate_after_lock";

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
  }
}

export function trackSocialEvent(
  event: SocialTelemetryEvent,
  props: Record<string, unknown> = {},
) {
  if (typeof window === "undefined" || typeof window.plausible !== "function") {
    return;
  }

  window.plausible(event, { props });
}
