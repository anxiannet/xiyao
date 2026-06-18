export type AIActionKind = 'move' | 'attack' | 'skill' | 'capture' | 'decree' | 'end_turn';

export type AIActionDraft = {
  kind: AIActionKind;
  label: string;
  unitId: string;
  targetTileId?: string;
  targetUnitId?: string;
};

export function createEndTurnAction(unitId: string): AIActionDraft {
  return {
    kind: 'end_turn',
    label: '结束行动',
    unitId,
  };
}

export function createMoveAction(unitId: string, targetTileId: string): AIActionDraft {
  return {
    kind: 'move',
    label: `移动到 ${targetTileId}`,
    unitId,
    targetTileId,
  };
}

export function createAttackAction(unitId: string, targetUnitId: string, targetName: string): AIActionDraft {
  return {
    kind: 'attack',
    label: `攻击 ${targetName}`,
    unitId,
    targetUnitId,
  };
}

export function createSkillAction(unitId: string, skillName: string): AIActionDraft {
  return {
    kind: skillName === '颁令' ? 'decree' : 'skill',
    label: skillName === '颁令' ? '颁布律令' : skillName,
    unitId,
  };
}

export function createCaptureAction(unitId: string, targetTileId: string): AIActionDraft {
  return {
    kind: 'capture',
    label: '占领当前据点',
    unitId,
    targetTileId,
  };
}
