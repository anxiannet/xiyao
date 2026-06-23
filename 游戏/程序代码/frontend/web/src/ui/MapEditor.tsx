import React from 'react';
import { MAP_CONFIGS_STORAGE_KEY, MAP_EDITOR_DRAFT_KEY } from '../data/mapStorage';
import { mapConfigs, type MapConfig, type MapGridConfig, type MapTileConfig, type ObjectiveType, type SquadId, type TerrainId } from '../data/maps';

type PaintMode = 'terrain' | 'deployment' | 'objective' | 'background';

const terrainOptions: TerrainId[] = ['plain', 'central_objective', 'edge_objective', 'high_ground', 'cover_shadow', 'dusk_rift', 'obstacle'];
const deploymentOptions: Array<SquadId | 'none'> = ['none', 'qingqiu', 'tianmen'];
const objectiveOptions: Array<ObjectiveType | 'none'> = ['none', 'central', 'edge'];
const backgroundOptions = ['background', 'playable'] as const;

const terrainLabels: Record<TerrainId, string> = {
  plain: '普通',
  central_objective: '中央',
  edge_objective: '边缘',
  high_ground: '高台',
  cover_shadow: '掩影',
  dusk_rift: '裂隙',
  obstacle: '障碍',
};

const terrainMarks: Record<TerrainId, string> = {
  plain: '',
  central_objective: '坛',
  edge_objective: '碑',
  high_ground: '台',
  cover_shadow: '影',
  dusk_rift: '裂',
  obstacle: '阻',
};

const REGULAR_HEX_HEIGHT_RATIO = Math.sqrt(3) / 2;
const GRID_ROTATION_DEG = 30;

function createTile(row: number, col: number): MapTileConfig {
  return {
    id: `${col},${row}`,
    q: col,
    r: row,
    row,
    col,
    terrain: 'plain',
    deploymentOwner: null,
    objectiveType: null,
    objectiveOwner: null,
    isBackground: false,
  };
}

function normalizeTiles(grid: MapGridConfig, existing: MapTileConfig[]) {
  const byId = new Map(existing.map((tile) => [tile.id, tile]));
  const tiles: MapTileConfig[] = [];
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      const id = `${col},${row}`;
      const existing = byId.get(id);
      tiles.push(existing ? { ...createTile(row, col), ...existing, isBackground: existing.isBackground ?? false } : createTile(row, col));
    }
  }
  return tiles;
}

function getRegularHexHeight(hexWidth: number) {
  return hexWidth * REGULAR_HEX_HEIGHT_RATIO;
}

function getRotatedHexBounds(hexWidth: number) {
  return {
    width: getRegularHexHeight(hexWidth),
    height: hexWidth,
  };
}

function getTileCenter(tile: MapTileConfig, grid: MapGridConfig) {
  const scale = grid.scale ?? 1;
  const bounds = getRotatedHexBounds(grid.hexWidth);
  const stepX = bounds.width + grid.gapX;
  const stepY = bounds.height * 0.75 + grid.gapY;
  const rowOffset = tile.row % 2 === 0 ? 0 : stepX / 2;
  return {
    x: (grid.offsetX + rowOffset + tile.col * stepX + bounds.width / 2) * scale,
    y: (grid.offsetY + tile.row * stepY + bounds.height / 2) * scale,
  };
}

function getCanvasSize(grid: MapGridConfig) {
  const scale = grid.scale ?? 1;
  const bounds = getRotatedHexBounds(grid.hexWidth);
  const stepX = bounds.width + grid.gapX;
  const stepY = bounds.height * 0.75 + grid.gapY;
  return {
    width: Math.max(320, (grid.offsetX * 2 + grid.cols * stepX + bounds.width) * scale),
    height: Math.max(320, (grid.offsetY * 2 + grid.rows * stepY + bounds.height) * scale),
  };
}

function getGridCoverage(grid: MapGridConfig) {
  const scale = grid.scale ?? 1;
  const bounds = getRotatedHexBounds(grid.hexWidth);
  const stepX = bounds.width + grid.gapX;
  const stepY = bounds.height * 0.75 + grid.gapY;
  return {
    width: (grid.offsetX + (grid.cols - 1) * stepX + stepX / 2 + bounds.width) * scale,
    height: (grid.offsetY + (grid.rows - 1) * stepY + bounds.height) * scale,
  };
}

function hexPoints(width: number, height: number) {
  const points = [
    [-width / 4, -height / 2],
    [width / 4, -height / 2],
    [width / 2, 0],
    [width / 4, height / 2],
    [-width / 4, height / 2],
    [-width / 2, 0],
  ];
  return points.map((point) => point.join(',')).join(' ');
}

function loadDraft(): MapConfig {
  const source = mapConfigs.tutorial_battlefield;
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(MAP_EDITOR_DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as MapConfig;
        const sourceTileIds = source.tiles.map((tile) => tile.id).join('|');
        const draftTileIds = draft.tiles.map((tile) => tile.id).join('|');
        const hasMatchingGrid = JSON.stringify(draft.grid) === JSON.stringify(source.grid) && draftTileIds === sourceTileIds;
        if (!hasMatchingGrid) return source;
        return { ...draft, tiles: normalizeTiles(draft.grid, draft.tiles) };
      }
    } catch {
      // Ignore corrupted drafts and fall back to the checked-in map.
    }
  }
  return source;
}

function formatMapConfigs(config: MapConfig) {
  const data = { [config.id]: config };
  return `export const mapConfigs = ${JSON.stringify(data, null, 2)};\n`;
}

export default function MapEditor() {
  const [config, setConfig] = React.useState<MapConfig>(() => loadDraft());
  const [imageSize, setImageSize] = React.useState<{ width: number; height: number } | null>(null);
  const [paintMode, setPaintMode] = React.useState<PaintMode>('terrain');
  const [terrain, setTerrain] = React.useState<TerrainId>('plain');
  const [deploymentOwner, setDeploymentOwner] = React.useState<SquadId | 'none'>('none');
  const [objectiveType, setObjectiveType] = React.useState<ObjectiveType | 'none'>('none');
  const [backgroundMark, setBackgroundMark] = React.useState<(typeof backgroundOptions)[number]>('background');
  const [showGrid, setShowGrid] = React.useState(true);
  const [showLabels, setShowLabels] = React.useState(false);
  const [gridOpacity, setGridOpacity] = React.useState(0.82);
  const [stageZoom, setStageZoom] = React.useState(1);
  const fallbackCanvasSize = React.useMemo(() => getCanvasSize(config.grid), [config.grid]);
  const canvasSize = imageSize ?? fallbackCanvasSize;
  const exportText = React.useMemo(() => formatMapConfigs(config), [config]);
  const autoFitImageRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    window.localStorage.setItem(MAP_EDITOR_DRAFT_KEY, JSON.stringify(config));
  }, [config]);

  React.useEffect(() => {
    if (!imageSize || autoFitImageRef.current === config.backgroundImage) return;
    const coverage = getGridCoverage(config.grid);
    if (coverage.width >= imageSize.width && coverage.height >= imageSize.height) {
      autoFitImageRef.current = config.backgroundImage;
      return;
    }
    autoFitImageRef.current = config.backgroundImage;
    fitGridToImage(imageSize);
  }, [config.backgroundImage, config.grid, imageSize]);

  function updateGrid(key: keyof MapGridConfig, value: number | string) {
    setConfig((current) => {
      const nextGrid = { ...current.grid, [key]: value } as MapGridConfig;
      if (key === 'hexWidth') nextGrid.hexHeight = Math.round(getRegularHexHeight(Number(value)));
      if (key === 'hexHeight') nextGrid.hexWidth = Math.round(Number(value) / REGULAR_HEX_HEIGHT_RATIO);
      return { ...current, grid: nextGrid, tiles: normalizeTiles(nextGrid, current.tiles) };
    });
  }

  function fitGridToImage(size = canvasSize) {
    setConfig((current) => {
      const scale = current.grid.scale ?? 1;
      const bounds = getRotatedHexBounds(current.grid.hexWidth);
      const stepX = bounds.width + current.grid.gapX;
      const stepY = bounds.height * 0.75 + current.grid.gapY;
      const nextGrid: MapGridConfig = {
        ...current.grid,
        hexHeight: Math.round(getRegularHexHeight(current.grid.hexWidth)),
        offsetX: 0,
        offsetY: 0,
        cols: Math.max(1, Math.ceil(size.width / Math.max(1, stepX * scale)) + 1),
        rows: Math.max(1, Math.ceil(size.height / Math.max(1, stepY * scale)) + 1),
      };
      return { ...current, grid: nextGrid, tiles: normalizeTiles(nextGrid, current.tiles) };
    });
  }

  function paintTile(tileId: string) {
    setConfig((current) => ({
      ...current,
      tiles: current.tiles.map((tile) => {
        if (tile.id !== tileId) return tile;
        if (paintMode === 'terrain') return { ...tile, terrain };
        if (paintMode === 'deployment') return { ...tile, deploymentOwner: deploymentOwner === 'none' ? null : deploymentOwner };
        if (paintMode === 'background') {
          const isBackground = backgroundMark === 'background';
          return {
            ...tile,
            isBackground,
            deploymentOwner: isBackground ? null : tile.deploymentOwner,
            objectiveType: isBackground ? null : tile.objectiveType,
            objectiveOwner: isBackground ? null : tile.objectiveOwner,
          };
        }
        return {
          ...tile,
          objectiveType: objectiveType === 'none' ? null : objectiveType,
          objectiveOwner: objectiveType === 'none' ? null : tile.objectiveOwner ?? 'neutral',
        };
      }),
    }));
  }

  function handleBackgroundFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setConfig((current) => ({ ...current, backgroundImage: String(reader.result) }));
    });
    reader.readAsDataURL(file);
  }

  async function copyExport() {
    await navigator.clipboard.writeText(exportText);
  }

  function downloadExport() {
    const blob = new Blob([exportText], { type: 'application/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'maps.ts';
    link.click();
    URL.revokeObjectURL(url);
  }

  function saveMapConfigs() {
    window.localStorage.setItem(MAP_CONFIGS_STORAGE_KEY, JSON.stringify({ [config.id]: config }));
  }

  return (
    <main className="mapEditor">
      <aside className="editorPanel">
        <header>
          <h1>MapEditor</h1>
          <a href="/">返回战斗页</a>
        </header>

        <label className="field">
          <span>地图名称</span>
          <input value={config.name} onChange={(event) => setConfig((current) => ({ ...current, name: event.target.value }))} />
        </label>
        <label className="field">
          <span>背景图路径</span>
          <input value={config.backgroundImage} onChange={(event) => setConfig((current) => ({ ...current, backgroundImage: event.target.value }))} />
        </label>
        <label className="field">
          <span>上传背景图</span>
          <input type="file" accept="image/*" onChange={(event) => handleBackgroundFile(event.target.files?.[0])} />
        </label>

        <section className="editorGroup">
          <h2>网格参数</h2>
          {(['rows', 'cols', 'hexWidth', 'hexHeight', 'offsetX', 'offsetY', 'gapX', 'gapY', 'scale'] as const).map((key) => (
            <label className="field compactField" key={key}>
              <span>{key}</span>
              <input
                type="number"
                step={key === 'scale' ? 0.05 : 1}
                value={config.grid[key] ?? 1}
                onChange={(event) => updateGrid(key, key === 'scale' ? Number(event.target.value) : Math.round(Number(event.target.value)))}
              />
            </label>
          ))}
          <label className="field compactField">
            <span>显示标注层</span>
            <input type="checkbox" checked={showGrid} onChange={(event) => setShowGrid(event.target.checked)} />
          </label>
          <label className="field compactField">
            <span>显示标注文字</span>
            <input type="checkbox" checked={showLabels} onChange={(event) => setShowLabels(event.target.checked)} />
          </label>
          <button onClick={() => fitGridToImage()}>网格铺满整图</button>
          <label className="field compactField">
            <span>gridOpacity</span>
            <input type="range" min="0" max="1" step="0.05" value={gridOpacity} onChange={(event) => setGridOpacity(Number(event.target.value))} />
          </label>
          <label className="field compactField">
            <span>整体缩放</span>
            <input type="range" min="0.25" max="2.5" step="0.05" value={stageZoom} onChange={(event) => setStageZoom(Number(event.target.value))} />
          </label>
          <div className="zoomButtons">
            <button onClick={() => setStageZoom((current) => Math.max(0.25, Number((current - 0.1).toFixed(2))))}>缩小</button>
            <button onClick={() => setStageZoom(1)}>100%</button>
            <button onClick={() => setStageZoom((current) => Math.min(2.5, Number((current + 0.1).toFixed(2))))}>放大</button>
            <span>{Math.round(stageZoom * 100)}%</span>
          </div>
        </section>

        <section className="editorGroup">
          <h2>标注</h2>
          <div className="segmented">
            <button className={paintMode === 'terrain' ? 'active' : ''} onClick={() => setPaintMode('terrain')}>地块</button>
            <button className={paintMode === 'deployment' ? 'active' : ''} onClick={() => setPaintMode('deployment')}>部署</button>
            <button className={paintMode === 'objective' ? 'active' : ''} onClick={() => setPaintMode('objective')}>据点</button>
            <button className={paintMode === 'background' ? 'active' : ''} onClick={() => setPaintMode('background')}>背景</button>
          </div>
          <label className="field">
            <span>terrain</span>
            <select value={terrain} onChange={(event) => setTerrain(event.target.value as TerrainId)}>
              {terrainOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="field">
            <span>deploymentOwner</span>
            <select value={deploymentOwner} onChange={(event) => setDeploymentOwner(event.target.value as SquadId | 'none')}>
              {deploymentOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="field">
            <span>objectiveType</span>
            <select value={objectiveType} onChange={(event) => setObjectiveType(event.target.value as ObjectiveType | 'none')}>
              {objectiveOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="field">
            <span>background</span>
            <select value={backgroundMark} onChange={(event) => setBackgroundMark(event.target.value as (typeof backgroundOptions)[number])}>
              <option value="background">background</option>
              <option value="playable">playable</option>
            </select>
          </label>
        </section>

        <section className="editorGroup actionStack">
          <button onClick={copyExport}>复制 maps.ts</button>
          <button onClick={downloadExport}>下载 maps.ts</button>
          <button onClick={saveMapConfigs}>保存到 LocalStorage</button>
        </section>
      </aside>

      <section className="editorStageWrap">
        <div className="editorZoomFrame" style={{ width: canvasSize.width * stageZoom, height: canvasSize.height * stageZoom }}>
          <div className="editorStage" style={{ width: canvasSize.width, height: canvasSize.height, transform: `scale(${stageZoom})` }}>
            {config.backgroundImage && (
              <img
                alt="map background"
                src={config.backgroundImage}
                onLoad={(event) => setImageSize({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                })}
              />
            )}
            <svg width={canvasSize.width} height={canvasSize.height} style={{ opacity: showGrid ? gridOpacity : 0 }}>
              {config.tiles.map((tile) => {
                const center = getTileCenter(tile, config.grid);
                const width = config.grid.hexWidth * (config.grid.scale ?? 1);
                const height = getRegularHexHeight(config.grid.hexWidth) * (config.grid.scale ?? 1);
                return (
                  <g className={`editorHex ${tile.isBackground ? 'backgroundTile' : ''}`} key={tile.id} transform={`translate(${center.x} ${center.y})`} onClick={() => paintTile(tile.id)}>
                    <polygon points={hexPoints(width, height)} transform={`rotate(${GRID_ROTATION_DEG})`} />
                    {showLabels && (
                      <>
                        <text y="-8">{tile.col},{tile.row}</text>
                        <text x="-18" y="14">{terrainMarks[tile.terrain]}</text>
                        <text x="18" y="14">{tile.deploymentOwner === 'qingqiu' ? '青' : tile.deploymentOwner === 'tianmen' ? '天' : ''}</text>
                        <text y="28">{tile.isBackground ? '背' : tile.objectiveType === 'central' ? '中' : tile.objectiveType === 'edge' ? '边' : ''}</text>
                      </>
                    )}
                    <title>{`${tile.id} ${tile.isBackground ? 'background' : terrainLabels[tile.terrain]} ${tile.deploymentOwner ?? 'none'} ${tile.objectiveType ?? 'none'}`}</title>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
        <textarea className="exportBox" readOnly value={exportText} />
      </section>
    </main>
  );
}
