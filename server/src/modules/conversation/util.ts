export function getConversationId(userId1: string, userId2: string): string {
  return "conv:" + [userId1, userId2].sort().join("_");
}
