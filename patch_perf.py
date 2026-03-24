import re

# ─────────────────────────────────────────────────────────────
# 1. App.tsx — configure QueryClient with staleTime / gcTime
# ─────────────────────────────────────────────────────────────
app_path = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\src\App.tsx'
with open(app_path, encoding='utf-8') as f:
    app = f.read()

old = 'const queryClient = new QueryClient();'
new = '''\
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 min — don't re-fetch while data is fresh
      gcTime:    10 * 60 * 1000,  // 10 min — keep in cache after unmount
      retry: 1,
      refetchOnWindowFocus: false, // don't spam Firestore on tab switch
    },
  },
});'''
app = app.replace(old, new)
with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app)
print('App.tsx patched' if new in app else 'App.tsx NOT patched')

# ─────────────────────────────────────────────────────────────
# 2. useMatches.ts — replace onSnapshot with getDocs + React Query
# ─────────────────────────────────────────────────────────────
matches_path = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\src\hooks\useMatches.ts'
new_matches = '''\
import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/client";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { type Match, type MatchPhase, matches as mockMatches } from "@/data/mockData";

type MatchRow = {
    id: string;
    home_team_code: string;
    away_team_code: string;
    home_score: number | null;
    away_score: number | null;
    match_date: string;
    venue_id: string;
    status: string;
    stage: string;
    group_id: string | null;
};

const phaseMap: Record<string, MatchPhase> = {
    group: "groups",
    GROUP_STAGE: "groups",
    round_of_32: "round-of-32",
    round_of_16: "round-of-16",
    qf: "quarter",
    sf: "semi",
    third_place: "third",
    final: "final",
};

async function fetchMatches(): Promise<Match[]> {
    const matchesRef = collection(db, "matches");
    const matchesQuery = query(matchesRef, orderBy("match_date", "asc"));
    const querySnapshot = await getDocs(matchesQuery);

    const rows = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
    })) as MatchRow[];

    const matches = rows.map((m) => ({
        id: m.id,
        homeTeam: m.home_team_code,
        awayTeam: m.away_team_code,
        homeScore: m.home_score ?? undefined,
        awayScore: m.away_score ?? undefined,
        date: m.match_date,
        stadium: m.venue_id,
        status: m.status as Match["status"],
        phase: (phaseMap[m.stage] || m.stage) as MatchPhase,
        group: m.group_id ?? undefined,
    })) as Match[];

    return matches.length > 0 ? matches : mockMatches;
}

export function useMatches() {
    const { data, isLoading } = useQuery({
        queryKey: ["matches"],
        queryFn: fetchMatches,
        staleTime: 10 * 60 * 1000, // matches are static for 10 min
    });

    return { data: data ?? null, isLoading };
}
'''
with open(matches_path, 'w', encoding='utf-8') as f:
    f.write(new_matches)
print(f'useMatches.ts rewritten ({new_matches.count(chr(10))} lines)')

# ─────────────────────────────────────────────────────────────
# 3. dashboard.service.ts — remove duplicate copa_news read
# ─────────────────────────────────────────────────────────────
dash_path = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\src\services\dashboard\dashboard.service.ts'
with open(dash_path, encoding='utf-8') as f:
    dash = f.read()

# Remove the copa_news query + its import items
old_imports = '''import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  doc, 
  getDoc,
  getCountFromServer
} from "firebase/firestore";'''
new_imports = '''import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  getCountFromServer
} from "firebase/firestore";'''
dash = dash.replace(old_imports, new_imports)

# Remove the news query block
old_news_query = '''    // 2. Get latest news
    const newsQuery = query(
      collection(db, "copa_news"), 
      orderBy("published_at", "desc"), 
      limit(3)
    );
    const newsPromise = getDocs(newsQuery);
    
    // 3. Get scheduled matches count'''
new_no_news = '    // 2. Get scheduled matches count'
dash = dash.replace(old_news_query, new_no_news)

# Remove newsPromise from Promise.all
old_promise_all = '''    const [membershipsSnap, newsSnap, scheduledMatchesSnap, profile] = await Promise.all([
      membershipsPromise,
      newsPromise,
      scheduledMatchesPromise,
      profilePromise
    ]);'''
new_promise_all = '''    const [membershipsSnap, scheduledMatchesSnap, profile] = await Promise.all([
      membershipsPromise,
      scheduledMatchesPromise,
      profilePromise
    ]);'''
dash = dash.replace(old_promise_all, new_promise_all)

# Remove the news mapping block that depends on newsSnap
old_news_map = '''    const news = newsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        category: data.source_name || "Geral",
        publishedAt: data.published_at,
        imageUrl: data.url_to_image,
        url: data.url,
      } as DashboardNewsItem;
    });'''
dash = dash.replace(old_news_map, '')

# Replace all remaining references to `news` in return values with empty array
# (There may be return statements that include `news,`)
dash = re.sub(r',\s*news\b', '', dash)
dash = re.sub(r'\bnews,\s*', '', dash)

with open(dash_path, 'w', encoding='utf-8') as f:
    f.write(dash)
print('dashboard.service.ts patched')

# Also remove DashboardNewsItem type export if unused
# Check if DashboardNewsItem is used elsewhere
import os, glob
src_base = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\src'
usage_count = 0
for root, dirs, files in os.walk(src_base):
    dirs[:] = [d for d in dirs if d != 'node_modules']
    for fname in files:
        if fname.endswith(('.ts', '.tsx')):
            fpath = os.path.join(root, fname)
            if fpath == dash_path:
                continue
            with open(fpath, encoding='utf-8') as f:
                content = f.read()
            if 'DashboardNewsItem' in content:
                usage_count += 1
                print(f'  DashboardNewsItem used in: {fpath}')
if usage_count == 0:
    print('  DashboardNewsItem not used elsewhere - safe to leave in service file')

print('All performance patches applied.')
