import type { MatchState } from '../engine/rules';

const CURRENT_KEY = 'xiyao_current_match';
const HISTORY_KEY = 'xiyao_match_history';

export type MatchHistoryItem = {
  id: string;
  mapId: string;
  mode: string;
  winner: string;
  rounds: number;
  createdAt: number;
};

export function saveCurrentMatch(match: MatchState): void {
  localStorage.setItem(CURRENT_KEY, JSON.stringify(match));
  if (match.phase === 'match_end' && match.result) appendMatchHistory(match);
}

export function loadCurrentMatch(): MatchState | null {
  const raw = localStorage.getItem(CURRENT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MatchState;
  } catch {
    return null;
  }
}

export function appendMatchHistory(match: MatchState): void {
  const history = loadMatchHistory();
  if (history.some((item) => item.id === match.id)) return;
  const item: MatchHistoryItem = {
    id: match.id,
    mapId: match.mapId,
    mode: match.mode,
    winner: match.result?.winner ?? 'unknown',
    rounds: match.result?.rounds ?? match.round,
    createdAt: Date.now(),
  };
  localStorage.setItem(HISTORY_KEY, JSON.stringify([item, ...history].slice(0, 60)));
}

export function loadMatchHistory(): MatchHistoryItem[] {
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as MatchHistoryItem[];
  } catch {
    return [];
  }
}
