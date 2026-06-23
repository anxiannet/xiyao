import type { ActionType, DecreeId, GlobalStatusId, TeamStatusId, TileStatusId, UnitState, UnitStatusId } from '../engine/rules';

const assetBase = '/assets';

export const unitAssetPaths: Record<string, string> = {
  suling: `${assetBase}/units/qingqiu_suling.png`,
  azhao: `${assetBase}/units/qingqiu_azhao.png`,
  qingluo: `${assetBase}/units/qingqiu_qingluo.png`,
  liuwei: `${assetBase}/units/qingqiu_liuwei.png`,
  xuanzhao: `${assetBase}/units/tianmen_xuanzhao.png`,
  baijin: `${assetBase}/units/tianmen_baijin.png`,
  chixiao: `${assetBase}/units/tianmen_chixiao.png`,
};

export const portraitAssetPaths: Record<string, string> = {
  suling: `${assetBase}/units/portraits/suling_portrait.png`,
  azhao: `${assetBase}/units/portraits/azhao_portrait.png`,
  qingluo: `${assetBase}/units/portraits/qingluo_portrait.png`,
  liuwei: `${assetBase}/units/portraits/liuwei_portrait.png`,
  xuanzhao: `${assetBase}/units/portraits/xuanzhao_portrait.png`,
  baijin: `${assetBase}/units/portraits/baijin_portrait.png`,
  chixiao: `${assetBase}/units/portraits/chixiao_portrait.png`,
};

export const unitStatusAssetPaths: Partial<Record<UnitStatusId, string>> = {
  fox_mark: `${assetBase}/statuses/unit_fox_mark.png`,
  lost: `${assetBase}/statuses/unit_lost.png`,
  fleeing: `${assetBase}/statuses/unit_escape.png`,
  guarded: `${assetBase}/statuses/unit_guard_array.png`,
};

export const tileStatusAssetPaths: Record<TileStatusId, string> = {
  foxfire_remnant: `${assetBase}/statuses/tile_foxfire_remnant.png`,
  inspection_zone: `${assetBase}/statuses/tile_inspection_zone.png`,
};

export const teamStatusAssetPaths: Record<TeamStatusId, string> = {
  foxfire_full: `${assetBase}/statuses/team_foxfire_surge.png`,
};

export const globalStatusAssetPaths: Record<GlobalStatusId, string> = {
  forbid_movement: `${assetBase}/statuses/global_forbid_movement.png`,
  martial_law: `${assetBase}/statuses/global_martial_law.png`,
  pursuit: `${assetBase}/statuses/global_pursuit.png`,
};

export const skillAssetPaths: Record<string, string> = {
  fox_step: `${assetBase}/icons/skills/skill_fox_step.png`,
  decoy: `${assetBase}/icons/skills/skill_decoy.png`,
  foxfire_path: `${assetBase}/icons/skills/skill_foxfire_path.png`,
  disturb_string: `${assetBase}/icons/skills/skill_disturb_string.png`,
  decree: `${assetBase}/icons/skills/skill_decree.png`,
  inspect: `${assetBase}/icons/skills/skill_inspect.png`,
  guard_array: `${assetBase}/icons/skills/skill_guard_array.png`,
};

export const actionAssetPaths: Record<ActionType, string> = {
  move: `${assetBase}/icons/actions/action_move.png`,
  attack: `${assetBase}/icons/actions/action_attack.png`,
  skill: `${assetBase}/icons/actions/action_skill.png`,
  capture: `${assetBase}/icons/actions/action_capture.png`,
  end_turn: `${assetBase}/icons/actions/action_end_turn.png`,
};

export const decreeOverlayAssetPaths: Record<DecreeId, string> = {
  forbid_movement: `${assetBase}/effects/decrees/decree_forbid_movement_overlay.png`,
  martial_law: `${assetBase}/effects/decrees/decree_martial_law_overlay.png`,
  pursuit: `${assetBase}/effects/decrees/decree_pursuit_overlay.png`,
};

export const factionAssetPaths = {
  qingqiu: `${assetBase}/icons/factions/faction_qingqiu.png`,
  tianmen: `${assetBase}/icons/factions/faction_tianmen.png`,
} as const;

export const uiAssetPaths = {
  actionBar: `${assetBase}/ui/ui_action_bar.png`,
  hudBar: `${assetBase}/ui/ui_hud_bar.png`,
  drawerBg: `${assetBase}/ui/ui_drawer_bg.png`,
  panelGold: `${assetBase}/ui/ui_panel_gold.png`,
  panelDark: `${assetBase}/ui/ui_panel_dark.png`,
} as const;

export function getUnitAssetPath(unit: UnitState) {
  if (unit.summon) return unitAssetPaths.azhao;
  return unitAssetPaths[unit.id] ?? null;
}

export function getPortraitAssetPath(unit: UnitState) {
  if (unit.summon) return portraitAssetPaths.azhao;
  return portraitAssetPaths[unit.id] ?? null;
}
