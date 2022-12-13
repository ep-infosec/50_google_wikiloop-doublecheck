import mongoose from 'mongoose';
import { asyncHandler, isAuthenticatedWithWikiUserName } from '~/server/common';
import { WikiActionProps } from '~/shared/models/wiki-action.model';

const express = require('express');

export const actionRouter = express.Router();

actionRouter.post('/revert', asyncHandler(async (req, res) => {
  const wikiAction: WikiActionProps = req.body;
  if (wikiAction.fromWikiUserName && !isAuthenticatedWithWikiUserName(req, wikiAction.fromWikiUserName)) {
    res.status(403).send(
      `The fromWikiUserName ${wikiAction.fromWikiUserName} ` +
      `doesn't match with authenticated wikiUserName ${req.user.displayName}`);
  } else {await mongoose.connection.db.collection('WikiActions').insertOne(wikiAction);}
}));

export default actionRouter;
