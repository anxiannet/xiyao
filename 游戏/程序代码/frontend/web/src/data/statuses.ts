export const statusConfigs = {
  fox_mark: { name: '狐印', type: 'unit' },
  lost: { name: '迷踪', type: 'unit' },
  fleeing: { name: '逃逸', type: 'unit' },
  route_guided: { name: '狐火引路', type: 'unit' },
  guarded: { name: '护阵', type: 'unit' },
  foxfire_full: { name: '狐火充盈', type: 'team' },
  foxfire_remnant: { name: '狐火残留', type: 'tile' },
  inspection_zone: { name: '勘验区', type: 'tile' },
  forbid_movement: { name: '禁行状态', type: 'global' },
  martial_law: { name: '戒严状态', type: 'global' },
  pursuit: { name: '追捕状态', type: 'global' },
} as const;
