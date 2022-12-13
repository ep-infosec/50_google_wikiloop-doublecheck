// npx ts-node -r tsconfig-paths/register --project tsconfig.json tscmd/dev/count-judgements.ts
import mongoose from 'mongoose';
import { getNewJudgementCounts } from '@/server/common';
require('dotenv').config();

async function CountJudgementMain() {
  console.log('Start! MONGODB_URI = ', process.env.MONGODB_URI);
  await mongoose.connect(process.env.MONGODB_URI, { useUnifiedTopology: true, useNewUrlParser: true });
  await mongoose.connection.db.command({ buildInfo: 1 });
  const ret = await getNewJudgementCounts(mongoose.connection.db, { wikiRevId: 'enwiki:952714500' }, 0, 10);
  console.log('Ret', ret);
}

CountJudgementMain().then(() => {
  console.log('CMD Done!');
  process.exit(0);
});
