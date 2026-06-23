import type { GameAction } from '../engine/rules';

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

  return (
    <section className="actionPanel actionBar">
      <div className="quickActions">
        <button className="actionButton" disabled={locked || !grouped.move} onClick={() => onSelectActionMode('move')}><b>↗</b><span>移动</span></button>
        <button className="actionButton" disabled={locked || !grouped.attack} onClick={() => onSelectActionMode('attack')}><b>⚔</b><span>攻击</span></button>
        <button className="actionButton" disabled={locked || !grouped.skill} onClick={() => grouped.skill && (canRunSkillDirectly ? onAction(grouped.skill) : onSelectActionMode('skill'))}><b>✦</b><span>技能</span></button>
        <button className="actionButton" disabled={locked || !grouped.capture} onClick={() => grouped.capture && onAction(grouped.capture)}><b>◆</b><span>占领</span></button>
        <button className="actionButton" disabled={locked || !grouped.end} onClick={() => grouped.end && onAction(grouped.end)}><b>✓</b><span>结束</span></button>
      </div>
    </section>
  );
}
