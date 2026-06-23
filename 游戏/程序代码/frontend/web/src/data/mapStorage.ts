import { mapConfigs, type MapConfig, type MapId } from './maps';

export const MAP_CONFIGS_STORAGE_KEY = 'xiyao_map_configs';
export const MAP_EDITOR_DRAFT_KEY = 'xiyao_map_editor_draft';

export function normalizeMapConfigs(value: unknown): Partial<Record<MapId, MapConfig>> | null {
  if (!value || typeof value !== 'object') return null;
  const configs = value as Partial<Record<MapId, MapConfig>>;
  if (!configs.tutorial_battlefield?.tiles?.length || !configs.tutorial_battlefield.grid) return null;
  return configs;
}

export function loadStoredMapConfigs(): Partial<Record<MapId, MapConfig>> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(MAP_CONFIGS_STORAGE_KEY);
    if (!raw) return null;
    return normalizeMapConfigs(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function getMapConfigs(): Record<MapId, MapConfig> {
  return mapConfigs;
}

export function getMapConfig(mapId: MapId): MapConfig {
  return getMapConfigs()[mapId];
}
