import { postAuthedFunction } from "@/services/backend/functions-http";

export type BolaoListingCard = {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  avatar_url: string | null;
  category: "public" | "private";
  is_paid: boolean;
  status: string;
};

export type BolaoListingRequestCard = {
  id: string;
  bolaoId: string;
  bolaoName: string;
  requestStatus: string;
  updatedAt: string | null;
};

export type UserBolaoListingResponse = {
  myBoloes: BolaoListingCard[];
  pendingRequests: BolaoListingRequestCard[];
  discoverBoloes: BolaoListingCard[];
};

export async function listUserBoloes(input: { token?: string } = {}) {
  return postAuthedFunction<UserBolaoListingResponse>("listUserBoloes", {}, input.token);
}
