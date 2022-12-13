const express = require('express');

const mongoose = require('mongoose');
export const metricsRouter = express.Router();
export const getTotalJudgement = async () => await mongoose.connection.db.collection('Interaction').countDocuments();
export const getActiveLoggedInUser = async () => {
  const onlineTime = new Date().getTime() / 1000 - (15/* min */ * 60);/* s */
  return await mongoose.connection.db.collection('Interaction')
      .aggregate([{
        $match: {
          timestamp: { $gte: onlineTime }, wikiUserName: { $exists: true },
        },
      }, { $group: { _id: '$wikiUserName', lastActive: { $max: '$timestamp' } } },
      { $project: { wikiUserName: '$_id', lastActive: 1 } }]).toArray();
};

export const getActiveAnonymousUser = async () => {
  const onlineTime = new Date().getTime() / 1000 - (15/* min */ * 60);/* s */
  return await mongoose.connection.db.collection('Interaction')
      .aggregate([{
        $match: {
          timestamp: { $gte: onlineTime }, wikiUserName: { $exists: false },
        },
      }, { $group: { _id: '$userGaId', lastActive: { $max: '$timestamp' } } },
      { $project: { userGaId: '$_id', lastActive: 1 } }]).toArray();
};

export const getMetrics = async () => {
  return {
    totalJudgement: await getTotalJudgement(),
    activeLoggedInUser: await (getActiveLoggedInUser()),
    activeAnonymousUser: await (getActiveAnonymousUser()),
  };
};

metricsRouter.get('/', async (req, res) => {
  res.send(await getMetrics());
});
