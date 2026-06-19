import { mapConfigs, type MapId } from '../data/maps';
import { validateMap } from '../engine/mapValidator';

export default function MapPreview({ mapId, onStartDeployment }: { mapId: MapId; onStartDeployment: () => void }) {
  const config = mapConfigs[mapId];
  const validation = validateMap(config);
  return (
    <section className="card preview">
      <h2>地图预览</h2>
      <p>{config.name}</p>
      <p>{config.typeNote}</p>
      <div className="stats">
        <span>格子 {config.tiles.length}/25</span>
        <span>青丘部署 {validation.qingqiuDeployment}</span>
        <span>天门部署 {validation.tianmenDeployment}</span>
        <span>中央据点 {validation.centralObjectives}</span>
        <span>边缘据点 {validation.edgeObjectives}</span>
      </div>
      <p className={validation.ok ? 'ok' : 'bad'}>校验结果：{validation.ok ? '通过' : validation.errors.join('；')}</p>
      {validation.warnings.map((warning) => <p className="warn" key={warning}>{warning}</p>)}
      <button disabled={!validation.ok} onClick={onStartDeployment}>进入部署阶段</button>
    </section>
  );
}
