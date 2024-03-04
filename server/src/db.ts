import { fakerEN, fakerFR_CA as faker } from "@faker-js/faker";
import { $Enums, PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { UniqueEnforcer } from "enforce-unique";
import fs from "fs/promises";
import { finished } from "node:stream/promises";
import { compute_hash } from "./modules/auth/auth.ts";
import { pauseWrite } from "./util.ts";

export const prisma = new PrismaClient({
  log: ["info", "warn", "error"],
});

export const prismaRoot = new PrismaClient({
  log: ["info", "warn", "error"],
  datasourceUrl: process.env.PRISMA_ROOT_MARIADB_URL,
});

export async function resetDatabase() {
  await prisma.$transaction([
    prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`,
    prisma.$executeRaw`TRUNCATE Follow;`,
    prisma.$executeRaw`TRUNCATE Moderator;`,
    prisma.$executeRaw`TRUNCATE Ban;`,
    prisma.$executeRaw`TRUNCATE Attachment;`,
    prisma.$executeRaw`TRUNCATE Vote;`,
    prisma.$executeRaw`TRUNCATE PushNotification;`,
    prisma.$executeRaw`TRUNCATE Session;`,
    prisma.$executeRaw`TRUNCATE Block;`,
    prisma.$executeRaw`TRUNCATE Post;`,
    prisma.$executeRaw`TRUNCATE TopPost;`,
    prisma.$executeRaw`TRUNCATE Sub;`,
    prisma.$executeRaw`TRUNCATE User;`,
    prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`,
  ]);

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

  function generate_score(level: number) {
    let score = 760 / (level + 0.1) - 30;
    if (faker.datatype.boolean(0.15)) score *= -1;
    return score;
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
  await prisma.post.createMany({
    data: topPosts.map((topPost) => ({
      sub_id: faker.helpers.arrayElement(subs),
      author_id: faker.helpers.maybe(() => faker.helpers.arrayElement(users), {
        probability: 90,
      }),
      created_at: faker.date.past({ years: 10 }),
      text_content: generate_text(20, 4000),
      delta_content: {},
      top_post_id: topPost,
      parent_id: null,
      cached_votes: generate_score(0),
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
    if (layer >= CREATE_COMMENTS_LAYER_COUNT) break;

    console.log(
      `Création des posts (commentaires): ${layer + 1}/${CREATE_COMMENTS_LAYER_COUNT}`,
    );

    const postStream = (
      await fs.open("/db-import/posts.tsv", "w")
    ).createWriteStream();

    for (let i = 0; i < CREATE_COMMENTS_LAYER_SIZE(layer); i++) {
      const parent = faker.helpers.arrayElement(posts);
      const sub_id = parent.sub_id;
      const author_id = faker.helpers.maybe(
        () => faker.helpers.arrayElement(users),
        {
          probability: 90,
        },
      );
      const created_at = faker.date
        .between({
          from: parent.created_at,
          to: faker.defaultRefDate(),
        })
        .toISOString()
        .replace("T", " ")
        .slice(0, -1);
      const text_content = generate_text(20, 4000);
      const delta_content = "{}";
      const top_post_id = parent.top_post_id;
      const parent_id = parent.id;
      const cached_votes = generate_score(layer + 1);

      await pauseWrite(
        postStream,
        `${sub_id}\t${author_id}\t${created_at}\t${text_content}\t${delta_content}\t${top_post_id}\t${parent_id}\t${cached_votes}\n`,
      );
    }

    postStream.close();
    if (!postStream.writableFinished) await finished(postStream);
    await prismaRoot.$executeRaw`LOAD DATA INFILE '/import/posts.tsv' IGNORE INTO TABLE Post (sub_id, author_id, created_at, text_content, delta_content, top_post_id, parent_id, cached_votes)`;
    await fs.rm("/db-import/posts.tsv");

    lastLayerFirstPost = (
      await prisma.post.findFirstOrThrow({
        orderBy: { id: "desc" },
        select: { id: true },
      })
    ).id;
  }
  console.log("Posts (commentaires) créés!");

  await prisma.$disconnect();
}
