import type { AIActionKind } from './actionGenerator';
import type { AIScoreBreakdown } from './scoringWeights';

export type AIDecisionLogEntry = {
  round: number;
  unit: string;
  action: AIActionKind;
  target: string;
  totalScore: number;
  breakdown: AIScoreBreakdown;
  candidates: Array<{
    label: string;
    totalScore: number;
    breakdown: AIScoreBreakdown;
  }>;
  result: string;
};

export type AIMatchStatistics = {
  result: string;
  rounds: number;
  kills: number;
  captures: number;
  skills: number;
  statusTriggers: number;
  decrees: number;
  mapId: string;
  firstSquad: string;
};
