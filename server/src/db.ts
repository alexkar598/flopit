import { fakerEN, fakerFR_CA as faker } from "@faker-js/faker";
import { $Enums, Prisma, PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { UniqueEnforcer } from "enforce-unique";
import { compute_hash } from "./modules/auth/auth.ts";

export const prisma = new PrismaClient({
  log: ["info", "warn", "error"],
});

export async function resetDatabase() {
  await prisma.follow.deleteMany();
  await prisma.moderator.deleteMany();
  await prisma.ban.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.pushNotification.deleteMany();
  await prisma.session.deleteMany();
  await prisma.block.deleteMany();
  await prisma.post.deleteMany();
  await prisma.topPost.deleteMany();
  await prisma.sub.deleteMany();
  await prisma.user.deleteMany();

  faker.seed(1337);
  fakerEN.seed(1337);

  const CREATE_USERS = 5_000;
  const CREATE_BLOCKS = 8_000;
  const CREATE_SUBS = 150;
  const CREATE_FOLLOWS = 15_000;
  const CREATE_MODERATORS = 6_000;
  const CREATE_BANS = 8_000;
  const CREATE_TOPPOSTS = 10_000;
  const CREATE_COMMENTS_LAYER_COUNT = 13;
  const CREATE_COMMENTS_LAYER_SIZE = (x: number) => 58_500 / (x + 2) - 2_700;
  const CREATE_VOTES_DOWNVOTES_MAX = 40;
  const CREATE_VOTES_UPVOTES_MAX = 50;

  const USER_SALT = crypto.randomBytes(32);
  //On ne va pas commencer à hasher les mots de passe unique de tout le monde, ca va prendre 10 ans
  const USER_PASSWORD = await compute_hash(USER_SALT, "123456");

  function generate_text(min: number, max: number) {
    const length = faker.helpers.rangeToNumber({ min, max }) + 1;
    let text = "";
    do {
      text += `${faker.lorem.sentence()} `;
    } while (text.length < length);

    return text.substring(0, length - 1).trim();
  }

  //Users
  console.log("Création des users...");
  const uniqueUsername = new UniqueEnforcer();
  const uniqueEmail = new UniqueEnforcer();
  await prisma.user.createMany({
    data: new Array(CREATE_USERS)
      .fill(null)
      .map(() => [faker.person.firstName(), faker.person.lastName()])
      .map(([firstName, lastName]) => ({
        username: uniqueUsername.enforce(() =>
          faker.internet.displayName({ firstName, lastName }),
        ),
        email: uniqueEmail.enforce(() =>
          faker.internet.email({ firstName, lastName }),
        ),
        password: USER_PASSWORD,
        salt: USER_SALT,
        theme: faker.helpers.arrayElement([
          $Enums.Theme.Dark,
          $Enums.Theme.Light,
        ]),
      })),
  });
  const users = (await prisma.user.findMany({ select: { id: true } })).map(
    ({ id }) => id,
  );
  console.log("Users créés!");

  //Blocks
  console.log("Création des blocks...");
  const uniqueBlock = new UniqueEnforcer();
  await prisma.block.createMany({
    data: new Array(CREATE_BLOCKS).fill(null).map(() =>
      uniqueBlock.enforce(() => ({
        blocked_id: faker.helpers.arrayElement(users),
        blocker_id: faker.helpers.arrayElement(users),
      })),
    ),
  });
  console.log("Blocks créés!");

  //Subs
  console.log("Création des subs...");
  const uniqueSub = new UniqueEnforcer();
  await prisma.sub.createMany({
    data: new Array(CREATE_SUBS).fill(null).map(() => ({
      name: uniqueSub.enforce(() => fakerEN.word.noun()),
      description: generate_text(200, 512),
    })),
  });
  const subs = (await prisma.sub.findMany({ select: { id: true } })).map(
    ({ id }) => id,
  );
  console.log("Subs créés!");

  //Follows
  console.log("Création des follows...");
  const uniqueFollow = new UniqueEnforcer();
  await prisma.follow.createMany({
    data: new Array(CREATE_FOLLOWS).fill(null).map(() =>
      uniqueFollow.enforce(() => ({
        user_id: faker.helpers.arrayElement(users),
        sub_id: faker.helpers.arrayElement(subs),
      })),
    ),
  });
  console.log("Follows créés!");

  //Moderators
  console.log("Création des moderators...");
  const uniqueModerator = new UniqueEnforcer();
  await prisma.moderator.createMany({
    data: new Array(CREATE_MODERATORS).fill(null).map(() =>
      uniqueModerator.enforce(() => ({
        user_id: faker.helpers.arrayElement(users),
        sub_id: faker.helpers.arrayElement(subs),
      })),
    ),
  });
  console.log("Moderators créés!");

  //Bans
  console.log("Création des bans...");
  await prisma.ban.createMany({
    data: new Array(CREATE_BANS).fill(null).map(() => ({
      user_id: faker.helpers.arrayElement(users),
      sub_id: faker.helpers.arrayElement(subs),
      reason: generate_text(200, 512),
      expiry: faker.date.anytime(),
    })),
  });
  console.log("Bans créés!");

  //TopPosts
  console.log("Création des topPosts...");
  await prisma.topPost.createMany({
    data: new Array(CREATE_TOPPOSTS).fill(null).map(() => ({
      title: generate_text(50, 200),
    })),
  });
  const topPosts = (
    await prisma.topPost.findMany({ select: { id: true } })
  ).map(({ id }) => id);
  console.log("TopPosts créés!");

  //Posts (posts)
  let lastLayerFirstPost =
    (
      await prisma.post.findFirst({
        orderBy: { id: "desc" },
        select: { id: true },
      })
    )?.id ?? "00000000-0000-0000-0000-000000000000";

  console.log("Création des posts (post)");
  await prisma.$executeRaw`ALTER TABLE \`Post\` DISABLE KEYS;`;
  await prisma.post.createMany({
    data: topPosts.map((topPost) => ({
      sub_id: faker.helpers.arrayElement(subs),
      author_id: faker.helpers.maybe(() => faker.helpers.arrayElement(users), {
        probability: 90,
      }),
      created_at: faker.date.past({ years: 10 }),
      text_content: generate_text(20, 4000),
      delta_content: "{}",
      top_post_id: topPost,
      parent_id: null,
      cached_votes: 0,
    })),
  });
  console.log("Posts (post) créés!");

  //Posts (commentaires)
  for (let layer = 0; ; layer++) {
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        sub_id: true,
        created_at: true,
        top_post_id: true,
      },
      where: {
        id: {
          gte: lastLayerFirstPost,
        },
      },
    });

    const votes: Prisma.VoteCreateManyInput[] = posts.flatMap(
      ({ id: post_id }) =>
        new Array(faker.number.int({ min: 0, max: CREATE_VOTES_UPVOTES_MAX }))
          .fill(null)
          .map(() => ({
            user_id: faker.helpers.arrayElement(users),
            post_id,
            value: 1,
          }))
          .concat(
            new Array(
              faker.number.int({ min: 0, max: CREATE_VOTES_DOWNVOTES_MAX }),
            )
              .fill(null)
              .map(() => ({
                user_id: faker.helpers.arrayElement(users),
                post_id,
                value: -1,
              })),
          ),
    );
    await prisma.vote.createMany({ data: votes, skipDuplicates: true });

    if (layer >= CREATE_COMMENTS_LAYER_COUNT) break;

    console.log(
      `Création des posts (commentaires): ${layer}/${CREATE_COMMENTS_LAYER_COUNT}`,
    );
    console.log(lastLayerFirstPost);

    const newPosts: Prisma.PostCreateManyInput[] = [];

    for (let i = 0; i < CREATE_COMMENTS_LAYER_SIZE(layer); i++) {
      const parent = faker.helpers.arrayElement(posts);
      newPosts.push({
        sub_id: parent.sub_id,
        author_id: faker.helpers.maybe(
          () => faker.helpers.arrayElement(users),
          {
            probability: 90,
          },
        ),
        created_at: faker.date.between({
          from: parent.created_at,
          to: faker.defaultRefDate(),
        }),
        text_content: generate_text(20, 4000),
        delta_content: "{}",
        top_post_id: parent.top_post_id,
        parent_id: parent.id,
        cached_votes: 0,
      });
    }

    await prisma.post.createMany({ data: newPosts });

    lastLayerFirstPost = (
      await prisma.post.findFirstOrThrow({
        orderBy: { id: "desc" },
        select: { id: true },
      })
    ).id;
  }
  await prisma.$executeRaw`ALTER TABLE \`Post\` ENABLE KEYS;`;
  console.log("Posts (commentaires) créés!");

  console.log("Recalcul des votes");
  await prisma.$executeRaw`
      UPDATE \`Post\` p
          INNER JOIN (
          SELECT SUM(value) as sum, v.post_id
          FROM \`Vote\` v
          GROUP BY v.post_id
          ) j
      ON j.post_id = p.id
          SET cached_votes = j.sum;
  `;
  console.log("Votes recalculés!");

  await prisma.$disconnect();
}
