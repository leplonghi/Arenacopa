export const FAVORITE_TEAM_STORAGE_KEY = "favorite_team";
export const FAVORITE_TEAM_UPDATED_EVENT = "arenacup:favorite-team-updated";

type FavoriteTeamUpdatedDetail = {
  teamCode: string | null;
};

export function getStoredFavoriteTeam() {
  return localStorage.getItem(FAVORITE_TEAM_STORAGE_KEY);
}

export function setStoredFavoriteTeam(teamCode: string) {
  localStorage.setItem(FAVORITE_TEAM_STORAGE_KEY, teamCode);
  window.dispatchEvent(
    new CustomEvent<FavoriteTeamUpdatedDetail>(FAVORITE_TEAM_UPDATED_EVENT, {
      detail: { teamCode },
    }),
  );
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
