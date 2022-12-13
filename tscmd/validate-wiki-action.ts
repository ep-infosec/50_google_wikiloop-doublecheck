/**
```bash
 npx ts-node -r tsconfig-paths/register --project tsconfig.json tscmd/validate-wiki-action.ts
```
*/
import mongoose from 'mongoose';
import { WikiAction } from '~/shared/models/wiki-action.model';
require('dotenv').config();

async function printStatus() {
  const total = await WikiAction.countDocuments();
  const wikiActions = await WikiAction.find();
  const invalid = []; const valid = [];
  const byFields = {};
  wikiActions.forEach((wikiAction) => {
    const e = wikiAction.validateSync();
    if (Object.keys(e.errors).length > 0) {invalid.push(wikiAction);} else {valid.push(wikiAction);}
    Object.keys(e.errors).forEach((field) => {
      byFields[field] = byFields[field] || 0;
      byFields[field]++;
    });
  });
  console.log(`Result: invalid:${invalid.length}, valid:${valid.length}, byFields:${JSON.stringify(byFields, null, 2)}`);
}

async function main() {
  console.log('Start! CMD_MONGODB_URI = ', process.env.CMD_MONGODB_URI);
  require('dotenv').config();

  await mongoose.connect(process.env.CMD_MONGODB_URI, { useUnifiedTopology: true, useNewUrlParser: true });
  const ret = await mongoose.connection.db.command({ buildInfo: 1 });

  console.log(`connected mongoose ${JSON.stringify(ret, null, 2)}`);
  await printStatus();
}

main().then(() => {
  console.log('CMD Done!');
  process.exit(0);
});
