import type { GameAction } from '../engine/rules';
import { actionAssetPaths, skillAssetPaths } from './assets';

export type SelectedActionMode = 'move' | 'attack' | 'skill';

export default function ActionPanel({
  actions,
  onAction,
  onSelectActionMode,
  locked,
}: {
  actions: GameAction[];
  onAction: (action: GameAction) => void;
  onSelectActionMode: (mode: SelectedActionMode) => void;
  onAIStep: () => void;
  onAIFull: () => void;
  locked: boolean;
}) {
  const skillActions = actions.filter((action) => action.type === 'skill');
  const grouped = {
    move: actions.find((action) => action.type === 'move'),
    attack: actions.find((action) => action.type === 'attack'),
    skill: skillActions[0],
    capture: actions.find((action) => action.type === 'capture'),
    end: actions.find((action) => action.type === 'end_turn'),
  };
  const canRunSkillDirectly = skillActions.length === 1 && !grouped.skill?.targetTileId && !grouped.skill?.targetUnitId;
  const skillIcon = grouped.skill?.skillId ? skillAssetPaths[grouped.skill.skillId] ?? actionAssetPaths.skill : actionAssetPaths.skill;

  return (
    <section className="actionPanel actionBar">
      <div className="quickActions">
        <button className="actionButton" disabled={locked || !grouped.move} onClick={() => onSelectActionMode('move')}><img src={actionAssetPaths.move} alt="" /><span>移动</span></button>
        <button className="actionButton" disabled={locked || !grouped.attack} onClick={() => onSelectActionMode('attack')}><img src={actionAssetPaths.attack} alt="" /><span>攻击</span></button>
        <button className="actionButton" disabled={locked || !grouped.skill} onClick={() => grouped.skill && (canRunSkillDirectly ? onAction(grouped.skill) : onSelectActionMode('skill'))}><img src={skillIcon} alt="" /><span>技能</span></button>
        <button className="actionButton" disabled={locked || !grouped.capture} onClick={() => grouped.capture && onAction(grouped.capture)}><img src={actionAssetPaths.capture} alt="" /><span>占领</span></button>
        <button className="actionButton" disabled={locked || !grouped.end} onClick={() => grouped.end && onAction(grouped.end)}><img src={actionAssetPaths.end_turn} alt="" /><span>结束</span></button>
      </div>
    </section>
  );
}
