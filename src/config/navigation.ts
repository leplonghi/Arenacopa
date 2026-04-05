export type AppNavIconKey =
  | "home"
  | "championships"
  | "news"
  | "guia"
  | "bolao"
  | "groups"
  | "profile";

export type AppNavItem = {
  path: string;
  labelKey: string;
  iconKey: AppNavIconKey;
  mobile?: boolean;
  desktop?: boolean;
  isFab?: boolean;
};

const isChampionshipRoute = (pathname: string) =>
  pathname === "/campeonatos" ||
  pathname === "/copa" ||
  pathname.startsWith("/copa/") ||
  pathname.startsWith("/campeonato/");

export const appNavigationItems: AppNavItem[] = [
  { path: "/", labelKey: "nav.home", iconKey: "home", mobile: true, desktop: true },
  { path: "/campeonatos", labelKey: "nav.championships", iconKey: "championships", mobile: true, desktop: true },
  { path: "/boloes", labelKey: "nav.bolao", iconKey: "bolao", mobile: true, desktop: true, isFab: true },
  { path: "/noticias", labelKey: "nav.news", iconKey: "news", mobile: true, desktop: true },
  { path: "/guia", labelKey: "nav.guia", iconKey: "guia", mobile: true, desktop: true },
  { path: "/grupos", labelKey: "nav.groups", iconKey: "groups", desktop: true },
  { path: "/perfil", labelKey: "nav.profile", iconKey: "profile", desktop: true },
];

export function isNavigationItemActive(pathname: string, item: AppNavItem) {
  if (item.path === "/") return pathname === "/";
  if (item.path === "/campeonatos") return isChampionshipRoute(pathname);
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}
