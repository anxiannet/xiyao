import { getMapConfig } from '../data/mapStorage';
import { type MapId } from '../data/maps';

export default function MapPreview({ mapId, locked, onStartDeployment }: { mapId: MapId; locked: boolean; onStartDeployment: () => void }) {
  const config = getMapConfig(mapId);
  return (
    <section className="card preview">
      <h2>地图预览</h2>
      <p>{config.name}</p>
      <p>{config.typeNote}</p>
      <div className="stats">
        <span>格子 {config.tiles.length}/35</span>
      </div>
      <button disabled={locked} onClick={onStartDeployment}>{locked ? '测试运行中...' : '进入部署阶段'}</button>
    </section>
  );
}
