export type AppNavIconKey =
  | "home"
  | "copa"
  | "championships"
  | "news"
  | "guia"
  | "bolao"
  | "groups"
  | "profile"
  | "menu";

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
  pathname.startsWith("/campeonato/");

const isCopaRoute = (pathname: string) =>
  pathname === "/copa" ||
  pathname.startsWith("/copa/");

export const appNavigationItems: AppNavItem[] = [
  { path: "/", labelKey: "nav.home", iconKey: "home", mobile: true, desktop: true },
  { path: "/campeonatos", labelKey: "nav.championships", iconKey: "championships", mobile: true, desktop: true },
  { path: "/boloes", labelKey: "nav.bolao", iconKey: "bolao", mobile: true, desktop: true, isFab: true },
  { path: "/grupos", labelKey: "nav.groups", iconKey: "groups", mobile: true, desktop: true },
  { path: "#menu", labelKey: "nav.menu", iconKey: "menu", mobile: true },
  // Desktop only or inside menu
  { path: "/copa", labelKey: "nav.copa", iconKey: "copa", desktop: true },
  { path: "/noticias", labelKey: "nav.news", iconKey: "news", desktop: true },
  { path: "/perfil", labelKey: "nav.profile", iconKey: "profile", desktop: true },
];

export function isNavigationItemActive(pathname: string, item: AppNavItem) {
  if (item.path === "/") return pathname === "/";
  if (item.path === "/copa") return isCopaRoute(pathname);
  if (item.path === "/campeonatos") return isChampionshipRoute(pathname);
  if (item.path === "#menu") return false; // Menu is not an active route
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}
