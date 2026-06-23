import { squads, type MatchState, type Phase } from '../engine/rules';
import { factionAssetPaths, globalStatusAssetPaths, teamStatusAssetPaths } from './assets';

const phaseName: Record<Phase, string> = {
  map_preview: '地图预览',
  deployment: '部署阶段',
  round_start: '回合开始',
  turn_start: '行动开始',
  unit_action: '行动阶段',
  turn_end: '行动结束',
  round_end: '回合结束',
  match_end: '结算',
};

export default function PhaseHeader({ match }: { match: MatchState }) {
  return (
    <header className="phase battleHud">
      <b>{phaseName[match.phase]}</b>
      <span className="hudFaction"><img src={factionAssetPaths[match.activeSquad]} alt="" />{match.round ? `第${match.round}回合` : '准备中'} · {squads[match.activeSquad].name}行动</span>
      <em className="hudStatus">
        {match.teamStatuses.qingqiu.includes('foxfire_full') && <img src={teamStatusAssetPaths.foxfire_full} alt="" />}
        {match.globalStatuses.map((status) => <img key={status} src={globalStatusAssetPaths[status]} alt="" />)}
        狐火 {match.foxfire}/5
      </em>
    </header>
  );
}
