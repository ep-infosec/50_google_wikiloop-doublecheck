// Interfaces shared across the app but not necessary going into database

export enum ScoreType {
  ORES_DAMAGING = 'ores_damaging',
  ORES_BADFAITH = 'ores_badfaith',
  STIKI = 'stiki',
  CLUEBOTNG = 'cbng',
  WIKITRUST = 'wikitrust'
}

export enum BasicJudgement {
  LooksGood = 'LooksGood',
  NotSure = 'NotSure',
  ShouldRevert = 'ShouldRevert'
}

export enum ApiStatus {
  NONE = '',
  PENDING = 'PENDING',
  ERROR = 'ERROR',
  SUCCEEDED = 'DONE'
}

export interface Score {
  type: ScoreType,
  score: number,
  isBad: boolean,
  version?: string,
}

export interface RevisionPanelItem {
  feed?: string,
  wiki: string,
  revId: number,
  title: string,
  summary: string,
  author: string,
  timestamp: number,
  diffHtml?: string,
}

export enum WikiActionType {
  RedirectToRevert = 'RedirectRevert',
  RedirectToHistory = 'RedirectToHistory',
  DirectRevert = 'DirectRevert',
}
