import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const admin = require("firebase-admin");
const {
  buildDraftBolaoDocument,
  buildPublishUpdate,
} = require("../functions/bolao-config/handlers.js");

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "arenacopa-web-2026";
const OWNER_UID = "dev-owner";
const PLAYER_UID = "dev-player";
const OWNER_EMAIL = "owner@arenacopa.local";
const PLAYER_EMAIL = "player@arenacopa.local";
const DEV_PASSWORD = "Dev123456!";

process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.FIREBASE_CONFIG ||= JSON.stringify({
  projectId: PROJECT_ID,
  storageBucket: `${PROJECT_ID}.appspot.com`,
});
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8280";
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
process.env.FIREBASE_STORAGE_EMULATOR_HOST ||= "127.0.0.1:9199";

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: PROJECT_ID,
    storageBucket: `${PROJECT_ID}.appspot.com`,
  });
}

const auth = admin.auth();
const db = admin.firestore();
const { Timestamp } = admin.firestore;

function daysFromNow(days, hour = 18) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

async function upsertUser({ uid, email, displayName }) {
  const payload = {
    email,
    password: DEV_PASSWORD,
    displayName,
    emailVerified: true,
    disabled: false,
  };

  try {
    await auth.updateUser(uid, payload);
  } catch (error) {
    if (error?.code !== "auth/user-not-found") {
      throw error;
    }
    await auth.createUser({ uid, ...payload });
  }
}

async function setDoc(path, data) {
  await db.doc(path).set(data, { merge: true });
}

function buildProfile({ uid, email, name }) {
  const nowIso = new Date().toISOString();
  return {
    profile: {
      user_id: uid,
      email,
      name,
      nickname: name.split(" ")[0],
      avatar_url: null,
      terms_accepted: true,
      terms_accepted_at: nowIso,
      accepted_terms_at: nowIso,
      preferred_language: "pt-BR",
      created_at: nowIso,
      updated_at: nowIso,
    },
    publicProfile: {
      user_id: uid,
      name,
      nickname: name.split(" ")[0],
      avatar_url: null,
      created_at: nowIso,
      updated_at: nowIso,
    },
  };
}

function buildOwnerMember({ bolaoId, nowIso }) {
  return {
    id: `${OWNER_UID}_${bolaoId}`,
    bolao_id: bolaoId,
    user_id: OWNER_UID,
    role: "admin",
    membership_status: "active",
    payment_status: "exempt",
    joined_at: nowIso,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

function buildPlayerMember({ bolaoId, nowIso }) {
  return {
    id: `${PLAYER_UID}_${bolaoId}`,
    bolao_id: bolaoId,
    user_id: PLAYER_UID,
    role: "member",
    membership_status: "active",
    payment_status: "pending",
    joined_at: nowIso,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

function buildBolao({ id, actorId, nowIso, input, publish = false, withPlayer = false }) {
  const draft = buildDraftBolaoDocument({
    bolaoId: id,
    actorId,
    nowIso,
    input,
  });

  const members = [
    {
      user_id: OWNER_UID,
      role: "admin",
      membership_status: "active",
      payment_status: "exempt",
      has_prediction: false,
    },
  ];

  if (withPlayer) {
    members.push({
      user_id: PLAYER_UID,
      role: "member",
      membership_status: "active",
      payment_status: "pending",
      has_prediction: false,
    });
  }

  const withMembers = {
    ...draft,
    members,
    member_count: members.length,
    metrics: {
      ...draft.metrics,
      accepted_invite_count: withPlayer ? 1 : 0,
    },
  };

  if (!publish) {
    return withMembers;
  }

  return buildPublishUpdate({
    current: withMembers,
    expectedConfigVersion: withMembers.integrity.config_version,
    actorId,
    nowIso,
  });
}

function buildMarket({ bolaoId, match, orderIndex }) {
  return {
    id: `${bolaoId}_exact_score_${match.id}`,
    bolao_id: bolaoId,
    template_id: "exact_score",
    slug: "exact_score",
    scope: "match",
    title: `${match.home_team_code} x ${match.away_team_code}`,
    description: "Placar exato da partida",
    help_text: "Informe o placar antes do fechamento.",
    match_id: match.id,
    phase_id: null,
    group_id: match.group_id || null,
    is_required: true,
    opens_at: new Date().toISOString(),
    closes_at: match.match_date,
    closes_at_ts: Timestamp.fromDate(new Date(match.match_date)),
    status: "open",
    points_exact: 10,
    points_partial: 3,
    multiplier: 1,
    supports_power_play: true,
    supports_confidence: false,
    order_index: orderIndex,
    prediction_type: "score",
    resolution_value: null,
    resolution_meta: null,
    resolved_at: null,
    resolved_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function seedUsers() {
  await upsertUser({ uid: OWNER_UID, email: OWNER_EMAIL, displayName: "Dono Local" });
  await upsertUser({ uid: PLAYER_UID, email: PLAYER_EMAIL, displayName: "Jogador Local" });

  for (const user of [
    { uid: OWNER_UID, email: OWNER_EMAIL, name: "Dono Local" },
    { uid: PLAYER_UID, email: PLAYER_EMAIL, name: "Jogador Local" },
  ]) {
    const { profile, publicProfile } = buildProfile(user);
    await setDoc(`profiles/${user.uid}`, profile);
    await setDoc(`public_profiles/${user.uid}`, publicProfile);
  }
}

async function seedCoreData(nowIso) {
  const matches = [
    {
      id: "local-wc2026-001",
      championship_id: "wc2026",
      home_team_code: "BRA",
      away_team_code: "ARG",
      match_date: daysFromNow(7, 19).toISOString(),
      venue_id: "local-arena",
      status: "scheduled",
      stage: "group",
      group_id: "A",
      home_score: null,
      away_score: null,
    },
    {
      id: "local-wc2026-002",
      championship_id: "wc2026",
      home_team_code: "FRA",
      away_team_code: "USA",
      match_date: daysFromNow(8, 21).toISOString(),
      venue_id: "local-arena",
      status: "scheduled",
      stage: "group",
      group_id: "B",
      home_score: null,
      away_score: null,
    },
    {
      id: "local-brasileirao-001",
      championship_id: "brasileirao2026",
      home_team_code: "FLA",
      away_team_code: "PAL",
      match_date: daysFromNow(5, 22).toISOString(),
      venue_id: "local-br",
      status: "scheduled",
      stage: "round",
      group_id: null,
      home_score: null,
      away_score: null,
    },
  ];

  const teams = [
    { id: "BRA", name: "Brasil", short_name: "BRA", type: "national", championships: ["wc2026"] },
    { id: "ARG", name: "Argentina", short_name: "ARG", type: "national", championships: ["wc2026"] },
    { id: "FRA", name: "Franca", short_name: "FRA", type: "national", championships: ["wc2026"] },
    { id: "USA", name: "Estados Unidos", short_name: "USA", type: "national", championships: ["wc2026"] },
    { id: "FLA", name: "Flamengo", short_name: "FLA", type: "club", championships: ["brasileirao2026"] },
    { id: "PAL", name: "Palmeiras", short_name: "PAL", type: "club", championships: ["brasileirao2026"] },
  ];

  for (const team of teams) {
    await setDoc(`teams/${team.id}`, { ...team, updated_at: nowIso });
  }

  for (const match of matches) {
    await setDoc(`matches/${match.id}`, { ...match, updated_at: nowIso });
  }

  await setDoc("standings/wc2026", {
    championship_id: "wc2026",
    updated_at: nowIso,
    table: teams.slice(0, 4).map((team, index) => ({
      position: index + 1,
      team_code: team.id,
      team_name: team.name,
      played: 0,
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals_for: 0,
      goals_against: 0,
    })),
  });

  await setDoc("copa_news/local-news-001", {
    title: "Ambiente local pronto para testar bolao",
    content: "Noticia local criada pelo seed dos emuladores.",
    category: "Local",
    source_name: "ArenaCopa Dev",
    championship_ids: ["wc2026"],
    published_at: nowIso,
    url: "http://localhost:8080",
    url_to_image: null,
    views: 0,
  });

  return matches;
}

async function seedBoloes(nowIso, matches) {
  const bolaoInputs = [
    {
      id: "local-editable-bolao",
      publish: false,
      withPlayer: false,
      input: {
        presentation: {
          name: "Bolao Local Editavel",
          description: "Use este bolao para testar edicao, regras e exclusao.",
          emoji: "AC",
          invite_message: "Convite local",
        },
        access_policy: {
          join_mode: "private_invite",
          visibility: "private",
        },
        competition_rules: {
          format: "classic",
          scoring_mode: "default",
          markets: ["exact_score", "match_winner"],
          prediction_cutoff_minutes: 0,
        },
        finance_rules: {
          finance_mode: "free",
          currency: "BRL",
        },
        championship_id: "wc2026",
        allowed_match_ids: matches.slice(0, 2).map((match) => match.id),
      },
    },
    {
      id: "local-public-bolao",
      publish: true,
      withPlayer: false,
      input: {
        presentation: {
          name: "Bolao Publico Local",
          description: "Aparece na area de explorar usando Functions locais.",
          emoji: "PUB",
        },
        access_policy: {
          join_mode: "public_open",
          visibility: "public",
        },
        competition_rules: {
          format: "classic",
          scoring_mode: "default",
          markets: ["exact_score", "match_winner"],
        },
        finance_rules: {
          finance_mode: "free",
          currency: "BRL",
        },
        championship_id: "wc2026",
        allowed_match_ids: "all",
      },
    },
    {
      id: "local-locked-bolao",
      publish: true,
      withPlayer: true,
      input: {
        presentation: {
          name: "Bolao Local com Participante",
          description: "Use para testar bloqueios, ranking e fluxo com membro.",
          emoji: "LOCK",
        },
        access_policy: {
          join_mode: "private_invite",
          visibility: "private",
        },
        competition_rules: {
          format: "classic",
          scoring_mode: "default",
          markets: ["exact_score", "match_winner"],
        },
        finance_rules: {
          finance_mode: "paid_external",
          entry_fee_amount: 10,
          currency: "BRL",
          distribution_model: "winner_take_all",
          payment_details: "PIX local de teste",
        },
        championship_id: "wc2026",
        allowed_match_ids: matches.slice(0, 2).map((match) => match.id),
      },
    },
    {
      id: "local-disposable-bolao",
      publish: false,
      withPlayer: false,
      input: {
        presentation: {
          name: "Bolao Local Descartavel",
          description: "Criado para smoke tests de exclusao.",
          emoji: "DEL",
        },
        access_policy: {
          join_mode: "private_invite",
          visibility: "private",
        },
        competition_rules: {
          format: "classic",
          scoring_mode: "default",
          markets: ["exact_score"],
        },
        finance_rules: {
          finance_mode: "free",
          currency: "BRL",
        },
        championship_id: "wc2026",
        allowed_match_ids: [matches[0].id],
      },
    },
  ];

  for (const config of bolaoInputs) {
    const bolao = buildBolao({
      id: config.id,
      actorId: OWNER_UID,
      nowIso,
      input: config.input,
      publish: config.publish,
      withPlayer: config.withPlayer,
    });
    await setDoc(`boloes/${config.id}`, bolao);
    await setDoc(`bolao_members/${OWNER_UID}_${config.id}`, buildOwnerMember({ bolaoId: config.id, nowIso }));

    if (config.withPlayer) {
      await setDoc(`bolao_members/${PLAYER_UID}_${config.id}`, buildPlayerMember({ bolaoId: config.id, nowIso }));
    }

    const allowedMatches = Array.isArray(config.input.allowed_match_ids)
      ? matches.filter((match) => config.input.allowed_match_ids.includes(match.id))
      : matches.filter((match) => match.championship_id === config.input.championship_id);

    for (const [index, match] of allowedMatches.entries()) {
      const market = buildMarket({ bolaoId: config.id, match, orderIndex: index });
      await setDoc(`bolao_markets/${market.id}`, market);
    }
  }

  await setDoc("bolao_rankings/dev-owner_local-locked-bolao", {
    bolao_id: "local-locked-bolao",
    user_id: OWNER_UID,
    total_points: 0,
    exact_matches: 0,
    position: 1,
    updated_at: nowIso,
  });
  await setDoc("bolao_rankings/dev-player_local-locked-bolao", {
    bolao_id: "local-locked-bolao",
    user_id: PLAYER_UID,
    total_points: 0,
    exact_matches: 0,
    position: 2,
    updated_at: nowIso,
  });
}

async function seedGroup(nowIso) {
  await setDoc("grupos/local-grupo", {
    id: "local-grupo",
    name: "Grupo Local",
    description: "Grupo local para testar bolao vinculado.",
    creator_id: OWNER_UID,
    category: "private",
    invite_code: "LOCALGRP",
    created_at: nowIso,
    updated_at: nowIso,
  });
  await setDoc(`grupo_members/${OWNER_UID}_local-grupo`, {
    id: `${OWNER_UID}_local-grupo`,
    grupo_id: "local-grupo",
    user_id: OWNER_UID,
    role: "admin",
    membership_status: "active",
    joined_at: nowIso,
    created_at: nowIso,
    updated_at: nowIso,
  });
}

async function seed() {
  const nowIso = new Date().toISOString();
  console.log(`[seed:local] Project: ${PROJECT_ID}`);
  console.log(`[seed:local] Auth emulator: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
  console.log(`[seed:local] Firestore emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);

  await seedUsers();
  const matches = await seedCoreData(nowIso);
  await seedGroup(nowIso);
  await seedBoloes(nowIso, matches);

  console.log("[seed:local] Done.");
  console.log(`[seed:local] Login owner: ${OWNER_EMAIL} / ${DEV_PASSWORD}`);
  console.log(`[seed:local] Login player: ${PLAYER_EMAIL} / ${DEV_PASSWORD}`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seed:local] Failed:", error);
    process.exit(1);
  });
