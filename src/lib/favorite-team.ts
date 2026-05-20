export const FAVORITE_TEAM_STORAGE_KEY = "favorite_team";
export const FAVORITE_TEAMS_STORAGE_KEY = "favorite_teams";
export const FAVORITE_TEAM_UPDATED_EVENT = "arenacup:favorite-team-updated";

type FavoriteTeamUpdatedDetail = {
  teamCode: string | null;
  teamCodes?: string[];
};

export function getStoredFavoriteTeam() {
  return localStorage.getItem(FAVORITE_TEAM_STORAGE_KEY);
}

export function getStoredFavoriteTeams() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVORITE_TEAMS_STORAGE_KEY) || "[]");
    if (Array.isArray(parsed)) {
      return parsed.filter((code): code is string => typeof code === "string" && code.trim().length > 0);
    }
  } catch {
    // ignore malformed local preferences
  }

  const legacyFavorite = getStoredFavoriteTeam();
  return legacyFavorite ? [legacyFavorite] : [];
}

export function setStoredFavoriteTeams(teamCodes: string[]) {
  const uniqueCodes = Array.from(new Set(teamCodes.map((code) => code.toUpperCase())));
  localStorage.setItem(FAVORITE_TEAMS_STORAGE_KEY, JSON.stringify(uniqueCodes));
  if (uniqueCodes[0]) {
    localStorage.setItem(FAVORITE_TEAM_STORAGE_KEY, uniqueCodes[0]);
  } else {
    localStorage.removeItem(FAVORITE_TEAM_STORAGE_KEY);
  }
  window.dispatchEvent(
    new CustomEvent<FavoriteTeamUpdatedDetail>(FAVORITE_TEAM_UPDATED_EVENT, {
      detail: { teamCode: uniqueCodes[0] ?? null, teamCodes: uniqueCodes },
    }),
  );
}

export function setStoredFavoriteTeam(teamCode: string) {
  const normalizedCode = teamCode.toUpperCase();
  const nextCodes = [normalizedCode, ...getStoredFavoriteTeams().filter((code) => code.toUpperCase() !== normalizedCode)];
  setStoredFavoriteTeams(nextCodes);
}

export function subscribeToFavoriteTeamUpdates(listener: (teamCode: string | null) => void) {
  const handleFavoriteTeamUpdate = (event: Event) => {
    if (event instanceof CustomEvent) {
      const detail = event.detail as FavoriteTeamUpdatedDetail | undefined;
      listener(detail?.teamCode ?? getStoredFavoriteTeam());
      return;
    }

    listener(getStoredFavoriteTeam());
  };

  window.addEventListener(FAVORITE_TEAM_UPDATED_EVENT, handleFavoriteTeamUpdate as EventListener);
  return () => {
    window.removeEventListener(FAVORITE_TEAM_UPDATED_EVENT, handleFavoriteTeamUpdate as EventListener);
  };
}
