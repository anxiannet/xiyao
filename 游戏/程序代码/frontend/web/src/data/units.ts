import type { UnitConfig } from '../engine/rules';

export const unitConfigs: UnitConfig[] = [
  { id: 'suling', name: '苏绫', squad: 'qingqiu', leader: true, hp: 5, mv: 3, atkDice: 2, defDice: 1, dmg: 1, rng: 1, skillId: 'fox_step', skillName: '狐步', initialStatuses: [] },
  { id: 'azhao', name: '阿照', squad: 'qingqiu', leader: false, hp: 3, mv: 3, atkDice: 1, defDice: 1, dmg: 1, rng: 1, skillId: 'decoy', skillName: '假身', initialStatuses: [] },
  { id: 'qingluo', name: '青萝', squad: 'qingqiu', leader: false, hp: 4, mv: 3, atkDice: 1, defDice: 1, dmg: 1, rng: 2, skillId: 'foxfire_path', skillName: '狐火引路', initialStatuses: [] },
  { id: 'liuwei', name: '琉尾', squad: 'qingqiu', leader: false, hp: 3, mv: 3, atkDice: 2, defDice: 1, dmg: 1, rng: 3, skillId: 'disturb_string', skillName: '扰弦', initialStatuses: [] },
  { id: 'xuanzhao', name: '玄照', squad: 'tianmen', leader: true, hp: 6, mv: 2, atkDice: 3, defDice: 2, dmg: 1, rng: 1, skillId: 'decree', skillName: '颁令', initialStatuses: [] },
  { id: 'baijin', name: '白烬', squad: 'tianmen', leader: false, hp: 4, mv: 2, atkDice: 2, defDice: 1, dmg: 1, rng: 2, skillId: 'inspect', skillName: '勘验', initialStatuses: [] },
  { id: 'chixiao', name: '赤霄', squad: 'tianmen', leader: false, hp: 7, mv: 2, atkDice: 2, defDice: 3, dmg: 1, rng: 1, skillId: 'guard_array', skillName: '护阵', initialStatuses: [] },
];
