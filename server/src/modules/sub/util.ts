import { prisma, PrismaClientTransaction } from "../../db.ts";

export async function isBanned(
  userId: string,
  subId: string,
  prismaObj: PrismaClientTransaction = prisma,
): Promise<boolean> {
  return (
    null !=
    (await prismaObj.ban.findFirst({
      select: { id: true },
      where: {
        user_id: userId,
        sub_id: subId,
        expiry: { lte: new Date() },
      },
    }))
  );
}
