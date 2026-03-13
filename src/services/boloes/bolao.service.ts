import { supabase } from "@/services/supabase/client";
import type { MemberData, Palpite } from "@/types/bolao";

type BolaoPalpiteRow = {
  id: string;
  bolao_id: string;
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  points: number | null;
  is_power_play: boolean | null;
  created_at: string;
};

function mapPalpite(row: BolaoPalpiteRow): Palpite {
  return {
    id: row.id,
    bolao_id: row.bolao_id,
    user_id: row.user_id,
    match_id: row.match_id,
    home_score: row.home_score,
    away_score: row.away_score,
    points: row.points,
    is_power_play: row.is_power_play ?? false,
    created_at: row.created_at,
  };
}

export async function saveBolaoPalpite(input: {
  bolaoId: string;
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  isPowerPlay: boolean;
  existingId?: string;
}) {
  if (input.existingId) {
    const { data, error } = await supabase
      .from("bolao_palpites")
      .update({
        home_score: input.homeScore,
        away_score: input.awayScore,
        is_power_play: input.isPowerPlay,
      })
      .eq("id", input.existingId)
      .select("id, bolao_id, user_id, match_id, home_score, away_score, points, is_power_play, created_at")
      .single();

    if (error) throw error;

    return mapPalpite(data);
  }

  const { data, error } = await supabase
    .from("bolao_palpites")
    .insert({
      bolao_id: input.bolaoId,
      user_id: input.userId,
      match_id: input.matchId,
      home_score: input.homeScore,
      away_score: input.awayScore,
      is_power_play: input.isPowerPlay,
    })
    .select("id, bolao_id, user_id, match_id, home_score, away_score, points, is_power_play, created_at")
    .single();

  if (error) throw error;

  return mapPalpite(data);
}

export async function removeBolaoMember(bolaoId: string, userId: string) {
  const { error } = await supabase
    .from("bolao_members")
    .delete()
    .eq("bolao_id", bolaoId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function updateBolaoMemberPaymentStatus(input: {
  bolaoId: string;
  userId: string;
  paymentStatus: NonNullable<MemberData["payment_status"]>;
}) {
  const { error } = await supabase
    .from("bolao_members")
    .update({ payment_status: input.paymentStatus })
    .eq("bolao_id", input.bolaoId)
    .eq("user_id", input.userId);

  if (error) throw error;
}
