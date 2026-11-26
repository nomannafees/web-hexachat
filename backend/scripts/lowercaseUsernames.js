// One-time script: turns every saved username into lowercase.
// Run it from the backend folder:   node scripts/lowercaseUsernames.js
// Add --dry to only see what would change.
import dotenv from "dotenv";
import mongoose from "mongoose";

import User from "../models/User.js";
import PendingRegistration from "../models/PendingRegistration.js";

dotenv.config();

const dryRun = process.argv.includes("--dry");

async function main() {
  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/whatsapp_clone"
  );

  const users = await User.find().select("username createdAt").lean();

  // Group by lowercase name to spot two accounts that would end up identical.
  const groups = new Map();
  for (const user of users) {
    const key = user.username.toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(user);
  }

  let changed = 0;
  let conflicts = 0;

  for (const [lower, group] of groups) {
    if (group.length > 1) {
      conflicts += 1;
      console.log(
        `CONFLICT "${lower}" is used by: ${group.map((u) => u.username).join(", ")} — rename one of them by hand, then run again.`
      );
      continue;
    }

    const [user] = group;
    if (user.username === lower) continue;

    console.log(`${user.username}  ->  ${lower}`);
    changed += 1;

    if (!dryRun) {
      // updateOne skips validators, so this only changes the username.
      await User.updateOne({ _id: user._id }, { $set: { username: lower } });
    }
  }

  // Unfinished signups can simply be lowercased too.
  const pendings = await PendingRegistration.find().select("username").lean();
  for (const pending of pendings) {
    const lower = pending.username.toLowerCase();
    if (pending.username !== lower && !dryRun) {
      await PendingRegistration.updateOne({ _id: pending._id }, { $set: { username: lower } });
    }
  }

  console.log(
    `${dryRun ? "[dry run] " : ""}${changed} username(s) lowercased, ${conflicts} conflict(s).`
  );

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});