export function collectBolaoLookupIds(input: {
  memberBolaoIds: string[];
  pendingRequestBolaoIds: string[];
}) {
  return Array.from(
    new Set(
      [...input.memberBolaoIds, ...input.pendingRequestBolaoIds]
        .map((id) => String(id || "").trim())
        .filter(Boolean),
    ),
  );
}

export function chunkBolaoIds(ids: string[], size = 30) {
  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }
  return chunks;
}
