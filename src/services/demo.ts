import { eq } from "drizzle-orm";
import type { Db } from "#/db";
import {
  account,
  children,
  families,
  modelCalls,
  parents,
  plans,
  pointsLog,
  proofs,
  quests,
  rewards,
  session,
  user,
  verdicts,
  type JudgeRecord,
  type Outcome,
} from "#/db/schema";
import type { Blobs } from "./deps";

export const DEMO_USER_ID = "demo-parent";
export const DEMO_FAMILY_ID = "demo-family";

// Real photos and covers captured during the build live in R2 under demo/; rows still work without them.
type SeedQuest = {
  title: string;
  readAloud: string;
  proofKind: "photo" | "voice" | "text";
  lookFor?: { phrase: string; count: number }[];
  answer: string;
  points: number;
  daysAgo: number;
  color: string;
  proof?: { text?: string; transcript?: { speaker: string; text: string }[]; photo?: string };
  outcome?: Outcome;
  parentChanged?: Outcome;
  recitation?: boolean;
};

const year = new Date().getFullYear();

const DEMO: { nickname: string; age: number; plan: string; quests: SeedQuest[] }[] = [
  {
    nickname: "Nadia",
    age: 6,
    plan: `Belajar berhitung sampai 20 dalam bahasa Indonesia, dan mengenal warna.
Huruf hijaiyah: alif sampai kha.
Hindari makhluk fantasi (naga, peri).
Rewards: es krim = 100, ke taman = 40, stiker = 15`,
    quests: [
      {
        title: "Tiga daun merah",
        readAloud: "Cari tiga daun merah di kebun, lalu foto ya!",
        proofKind: "photo",
        lookFor: [{ phrase: "red leaf", count: 3 }],
        answer: "three red leaves",
        points: 10,
        daysAgo: 13,
        color: "#FFAAA5",
        proof: { photo: "demo/leaves.jpg" },
        outcome: "accepted",
      },
      {
        title: "Hitung sampai sepuluh",
        readAloud: "Ayo hitung dari satu sampai sepuluh dengan suara keras!",
        proofKind: "voice",
        answer: "satu dua tiga empat lima enam tujuh delapan sembilan sepuluh",
        points: 8,
        daysAgo: 11,
        color: "#A8E6CF",
        proof: {
          transcript: [
            { speaker: "A", text: "Ayo Nadia, mulai dari satu." },
            { speaker: "B", text: "Satu, dua, tiga, empat, lima, enam, tujuh, delapan, sembilan, sepuluh!" },
          ],
        },
        outcome: "accepted",
      },
      {
        title: "Benda biru",
        readAloud: "Temukan dua benda berwarna biru di rumah dan foto!",
        proofKind: "photo",
        lookFor: [{ phrase: "blue object", count: 2 }],
        answer: "two blue things",
        points: 10,
        daysAgo: 8,
        color: "#B5D8FF",
        proof: { photo: "demo/blue.jpg" },
        outcome: "not_yet",
      },
      {
        title: "Alif, ba, ta",
        readAloud: "Ucapkan huruf alif, ba, ta, tsa dengan pelan.",
        proofKind: "voice",
        answer: "alif ba ta tsa",
        points: 12,
        daysAgo: 4,
        color: "#E2C2FF",
        recitation: true,
        proof: { transcript: [{ speaker: "A", text: "Alif, ba, ta, tsa." }] },
        outcome: "needs_parent",
      },
      {
        title: "Lima sendok",
        readAloud: "Susun lima sendok di meja, lalu foto!",
        proofKind: "photo",
        lookFor: [{ phrase: "spoon", count: 5 }],
        answer: "five spoons",
        points: 10,
        daysAgo: 1,
        color: "#F6D365",
      },
    ],
  },
  {
    nickname: "Umar",
    age: 10,
    plan: `Fractions with halves and quarters, English spelling, the water cycle.
Answers in English. No fantasy creatures.
Rewards: football at the park = 60, ice cream = 100`,
    quests: [
      {
        title: "Half a pizza",
        readAloud: "If a pizza has 8 slices and you eat half, how many slices are left? Type your answer.",
        proofKind: "text",
        answer: "4",
        points: 10,
        daysAgo: 12,
        color: "#FFD3B6",
        proof: { text: "4 slices" },
        outcome: "accepted",
      },
      {
        title: "Water cycle",
        readAloud: "Explain out loud how rain gets back up into the clouds.",
        proofKind: "voice",
        answer: "evaporation, condensation, precipitation",
        points: 15,
        daysAgo: 9,
        color: "#B5D8FF",
        proof: {
          transcript: [
            {
              speaker: "A",
              text: "The sun heats the water and it goes up as vapour, then it makes clouds and rains.",
            },
          ],
        },
        outcome: "accepted",
        parentChanged: "accepted",
      },
      {
        title: "Spell five words",
        readAloud: "Type these words: because, friend, beautiful, which, believe.",
        proofKind: "text",
        answer: "because friend beautiful which believe",
        points: 12,
        daysAgo: 6,
        color: "#A8E6CF",
        proof: { text: "becuase friend beatiful which beleive" },
        outcome: "not_yet",
      },
      {
        title: "Quarters at home",
        readAloud: "Cut an apple into quarters and take a photo.",
        proofKind: "photo",
        lookFor: [{ phrase: "apple slice", count: 4 }],
        answer: "an apple in four equal pieces",
        points: 12,
        daysAgo: 3,
        color: "#FFAAA5",
        proof: { photo: "demo/apple.jpg" },
        outcome: "accepted",
        parentChanged: "not_yet",
      },
      {
        title: "Quarter of twenty",
        readAloud: "What is one quarter of 20? Type it.",
        proofKind: "text",
        answer: "5",
        points: 8,
        daysAgo: 0,
        color: "#F6D365",
      },
    ],
  },
];

const judgesFor = (outcome: Outcome): JudgeRecord[] => {
  const [a, b] =
    outcome === "accepted"
      ? [
          ["pass", 0.92],
          ["pass", 0.86],
        ]
      : outcome === "not_yet"
        ? [
            ["fail", 0.9],
            ["fail", 0.81],
          ]
        : [
            ["pass", 0.88],
            ["fail", 0.64],
          ];
  return [
    {
      model: "muse-spark-1.3",
      decision: a![0] as "pass",
      confidence: a![1] as number,
      reason: "Seeded Verdict",
      textOnly: false,
    },
    {
      model: "meta-models/muse-spark-open-1026",
      decision: b![0] as "pass",
      confidence: b![1] as number,
      reason: "Seeded Verdict",
      textOnly: false,
    },
  ];
};

async function clearDemo(db: Db) {
  const f = DEMO_FAMILY_ID;
  await db.delete(modelCalls).where(eq(modelCalls.familyId, f));
  await db.delete(pointsLog).where(eq(pointsLog.familyId, f));
  await db.delete(verdicts).where(eq(verdicts.familyId, f));
  await db.delete(proofs).where(eq(proofs.familyId, f));
  await db.delete(quests).where(eq(quests.familyId, f));
  await db.delete(rewards).where(eq(rewards.familyId, f));
  await db.delete(plans).where(eq(plans.familyId, f));
  await db.delete(children).where(eq(children.familyId, f));
  await db.delete(parents).where(eq(parents.familyId, f));
  await db.delete(families).where(eq(families.id, f));
  await db.delete(session).where(eq(session.userId, DEMO_USER_ID));
  await db.delete(account).where(eq(account.userId, DEMO_USER_ID));
  await db.delete(user).where(eq(user.id, DEMO_USER_ID));
}

// Rebuilds the Demo Family from scratch. Run by `pnpm seed`, the nightly cron, and the first demo sign-in.
export async function seedDemo(db: Db, blobs: Blobs) {
  await clearDemo(db);
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  await db.insert(user).values({
    id: DEMO_USER_ID,
    name: "Demo Parent",
    email: "demo@gameschooling.invalid",
    emailVerified: true,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  });
  await db.insert(families).values({ id: DEMO_FAMILY_ID });
  const parentId = "demo-parent-row";
  await db.insert(parents).values({ id: parentId, familyId: DEMO_FAMILY_ID, userId: DEMO_USER_ID });

  for (const [ci, kid] of DEMO.entries()) {
    const childId = `demo-child-${ci}`;
    await db.insert(children).values({
      id: childId,
      familyId: DEMO_FAMILY_ID,
      nickname: kid.nickname,
      birthYear: year - kid.age,
      createdAt: new Date(now - 15 * day + ci),
    });
    await db.insert(plans).values({ familyId: DEMO_FAMILY_ID, childId, text: kid.plan });
    for (const [name, price] of [...kid.plan.matchAll(/([^,:\n]+?)\s*=\s*(\d+)/g)].map(
      (m) => [m[1]!.trim(), Number(m[2])] as const,
    )) {
      await db.insert(rewards).values({ familyId: DEMO_FAMILY_ID, childId, name, price });
    }

    for (const [qi, q] of kid.quests.entries()) {
      const questId = `demo-quest-${ci}-${qi}`;
      const at = new Date(now - q.daysAgo * day);
      const finalOutcome = q.parentChanged ?? q.outcome;
      const coverKey = `demo/cover-${ci}-${qi}.webp`;
      await db.insert(quests).values({
        id: questId,
        familyId: DEMO_FAMILY_ID,
        childId,
        title: q.title,
        readAloud: q.readAloud,
        proofKind: q.proofKind,
        lookFor: q.lookFor ?? [],
        answer: q.answer,
        recitation: q.recitation ?? false,
        points: q.points,
        coverKey: (await blobs.get(coverKey)) ? coverKey : null,
        coverColor: q.color,
        status: finalOutcome === "accepted" ? "done" : "open",
        createdAt: at,
      });
      if (!q.proof || !q.outcome) continue;

      const proofId = `demo-proof-${ci}-${qi}`;
      const proofAt = new Date(at.getTime() + 3 * 60 * 60 * 1000);
      await db.insert(proofs).values({
        id: proofId,
        familyId: DEMO_FAMILY_ID,
        questId,
        kind: q.proofKind,
        photoKey: q.proof.photo && (await blobs.get(q.proof.photo)) ? q.proof.photo : null,
        transcript:
          q.proof.transcript?.map((t, i) => ({ ...t, startMs: i * 3000, endMs: i * 3000 + 2500 })) ?? null,
        text: q.proof.text ?? null,
        createdAt: proofAt,
      });
      const verdictId = `demo-verdict-${ci}-${qi}`;
      await db.insert(verdicts).values({
        id: verdictId,
        familyId: DEMO_FAMILY_ID,
        proofId,
        judges: judgesFor(q.outcome),
        sam:
          q.lookFor?.map((l) => ({
            phrase: l.phrase,
            wanted: l.count,
            found: q.outcome === "accepted" ? l.count : 1,
            raw: "",
          })) ?? null,
        modelOutcome: q.outcome,
        outcome: finalOutcome!,
        decidedBy: q.parentChanged ? parentId : "models",
        decidedAt: new Date(proofAt.getTime() + (q.parentChanged ? 6 : 0) * 60 * 60 * 1000),
        createdAt: proofAt,
      });
      if (q.outcome === "accepted") {
        await db.insert(pointsLog).values({
          familyId: DEMO_FAMILY_ID,
          childId,
          kind: "earned",
          amount: q.points,
          verdictId,
          createdAt: proofAt,
        });
      }
      if (q.parentChanged && q.parentChanged !== q.outcome) {
        const amount = q.parentChanged === "accepted" ? q.points : -q.points;
        await db.insert(pointsLog).values({
          familyId: DEMO_FAMILY_ID,
          childId,
          kind: "overrule",
          amount,
          verdictId,
          createdAt: new Date(proofAt.getTime() + 6 * 60 * 60 * 1000),
        });
      }
    }
  }
  await db.insert(pointsLog).values({
    familyId: DEMO_FAMILY_ID,
    childId: "demo-child-0",
    kind: "reward_given",
    amount: -15,
    rewardName: "stiker",
    createdAt: new Date(now - 5 * day),
  });
}
