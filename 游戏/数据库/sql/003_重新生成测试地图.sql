-- 《夕妖》MVP 测试地图重生成 SQL
-- 目标：将 test_map_a / test_map_b / test_map_c 重生成为 25 格地图。
-- 原则：每方 5 个部署格；据点不在部署区；特殊地形保持距离；用于 AI vs AI 自动对战验证。

update public.xiyao_cfg_maps
set name = case id
  when 'test_map_a' then '测试地图A：开阔对称图'
  when 'test_map_b' then '测试地图B：裂隙侧路图'
  when 'test_map_c' then '测试地图C：障碍分流图'
  else name
end
where id in ('test_map_a', 'test_map_b', 'test_map_c');

delete from public.xiyao_cfg_map_tiles
where map_id in ('test_map_a', 'test_map_b', 'test_map_c');

-- 测试地图A：开阔对称图
insert into public.xiyao_cfg_map_tiles (id, map_id, q, r, terrain_id, deployment_owner) values
('test_map_a_-2_-2','test_map_a',-2,-2,'plain','qingqiu'),
('test_map_a_-1_-2','test_map_a',-1,-2,'plain',null),
('test_map_a_0_-2','test_map_a',0,-2,'edge_objective',null),
('test_map_a_1_-2','test_map_a',1,-2,'plain',null),
('test_map_a_2_-2','test_map_a',2,-2,'plain','tianmen'),
('test_map_a_-2_-1','test_map_a',-2,-1,'plain','qingqiu'),
('test_map_a_-1_-1','test_map_a',-1,-1,'cover_shadow',null),
('test_map_a_0_-1','test_map_a',0,-1,'dusk_rift',null),
('test_map_a_1_-1','test_map_a',1,-1,'high_ground',null),
('test_map_a_2_-1','test_map_a',2,-1,'cover_shadow','tianmen'),
('test_map_a_-2_0','test_map_a',-2,0,'plain','qingqiu'),
('test_map_a_-1_0','test_map_a',-1,0,'plain',null),
('test_map_a_0_0','test_map_a',0,0,'central_objective',null),
('test_map_a_1_0','test_map_a',1,0,'plain',null),
('test_map_a_2_0','test_map_a',2,0,'plain','tianmen'),
('test_map_a_-2_1','test_map_a',-2,1,'cover_shadow','qingqiu'),
('test_map_a_-1_1','test_map_a',-1,1,'high_ground',null),
('test_map_a_0_1','test_map_a',0,1,'plain',null),
('test_map_a_1_1','test_map_a',1,1,'cover_shadow',null),
('test_map_a_2_1','test_map_a',2,1,'plain','tianmen'),
('test_map_a_-2_2','test_map_a',-2,2,'plain','qingqiu'),
('test_map_a_-1_2','test_map_a',-1,2,'plain',null),
('test_map_a_0_2','test_map_a',0,2,'edge_objective',null),
('test_map_a_1_2','test_map_a',1,2,'plain',null),
('test_map_a_2_2','test_map_a',2,2,'plain','tianmen');

-- 测试地图B：裂隙侧路图
insert into public.xiyao_cfg_map_tiles (id, map_id, q, r, terrain_id, deployment_owner) values
('test_map_b_-2_-2','test_map_b',-2,-2,'plain','qingqiu'),
('test_map_b_-1_-2','test_map_b',-1,-2,'cover_shadow',null),
('test_map_b_0_-2','test_map_b',0,-2,'edge_objective',null),
('test_map_b_1_-2','test_map_b',1,-2,'high_ground',null),
('test_map_b_2_-2','test_map_b',2,-2,'plain','tianmen'),
('test_map_b_-2_-1','test_map_b',-2,-1,'plain','qingqiu'),
('test_map_b_-1_-1','test_map_b',-1,-1,'plain',null),
('test_map_b_0_-1','test_map_b',0,-1,'plain',null),
('test_map_b_1_-1','test_map_b',1,-1,'plain',null),
('test_map_b_2_-1','test_map_b',2,-1,'cover_shadow','tianmen'),
('test_map_b_-2_0','test_map_b',-2,0,'plain','qingqiu'),
('test_map_b_-1_0','test_map_b',-1,0,'dusk_rift',null),
('test_map_b_0_0','test_map_b',0,0,'central_objective',null),
('test_map_b_1_0','test_map_b',1,0,'dusk_rift',null),
('test_map_b_2_0','test_map_b',2,0,'plain','tianmen'),
('test_map_b_-2_1','test_map_b',-2,1,'cover_shadow','qingqiu'),
('test_map_b_-1_1','test_map_b',-1,1,'plain',null),
('test_map_b_0_1','test_map_b',0,1,'plain',null),
('test_map_b_1_1','test_map_b',1,1,'plain',null),
('test_map_b_2_1','test_map_b',2,1,'plain','tianmen'),
('test_map_b_-2_2','test_map_b',-2,2,'plain','qingqiu'),
('test_map_b_-1_2','test_map_b',-1,2,'high_ground',null),
('test_map_b_0_2','test_map_b',0,2,'edge_objective',null),
('test_map_b_1_2','test_map_b',1,2,'cover_shadow',null),
('test_map_b_2_2','test_map_b',2,2,'plain','tianmen');

-- 测试地图C：障碍分流图
insert into public.xiyao_cfg_map_tiles (id, map_id, q, r, terrain_id, deployment_owner) values
('test_map_c_-2_-2','test_map_c',-2,-2,'plain','qingqiu'),
('test_map_c_-1_-2','test_map_c',-1,-2,'high_ground',null),
('test_map_c_0_-2','test_map_c',0,-2,'edge_objective',null),
('test_map_c_1_-2','test_map_c',1,-2,'plain',null),
('test_map_c_2_-2','test_map_c',2,-2,'plain','tianmen'),
('test_map_c_-2_-1','test_map_c',-2,-1,'plain','qingqiu'),
('test_map_c_-1_-1','test_map_c',-1,-1,'obstacle',null),
('test_map_c_0_-1','test_map_c',0,-1,'dusk_rift',null),
('test_map_c_1_-1','test_map_c',1,-1,'cover_shadow',null),
('test_map_c_2_-1','test_map_c',2,-1,'cover_shadow','tianmen'),
('test_map_c_-2_0','test_map_c',-2,0,'plain','qingqiu'),
('test_map_c_-1_0','test_map_c',-1,0,'plain',null),
('test_map_c_0_0','test_map_c',0,0,'central_objective',null),
('test_map_c_1_0','test_map_c',1,0,'plain',null),
('test_map_c_2_0','test_map_c',2,0,'plain','tianmen'),
('test_map_c_-2_1','test_map_c',-2,1,'cover_shadow','qingqiu'),
('test_map_c_-1_1','test_map_c',-1,1,'cover_shadow',null),
('test_map_c_0_1','test_map_c',0,1,'dusk_rift',null),
('test_map_c_1_1','test_map_c',1,1,'obstacle',null),
('test_map_c_2_1','test_map_c',2,1,'plain','tianmen'),
('test_map_c_-2_2','test_map_c',-2,2,'plain','qingqiu'),
('test_map_c_-1_2','test_map_c',-1,2,'plain',null),
('test_map_c_0_2','test_map_c',0,2,'edge_objective',null),
('test_map_c_1_2','test_map_c',1,2,'high_ground',null),
('test_map_c_2_2','test_map_c',2,2,'plain','tianmen');

-- 校验：每张地图应为 25 格，每方部署格各 5 个。
select map_id, count(*) as total_tiles
from public.xiyao_cfg_map_tiles
where map_id in ('test_map_a', 'test_map_b', 'test_map_c')
group by map_id
order by map_id;

select map_id, deployment_owner, count(*) as tile_count
from public.xiyao_cfg_map_tiles
where map_id in ('test_map_a', 'test_map_b', 'test_map_c')
  and deployment_owner is not null
group by map_id, deployment_owner
order by map_id, deployment_owner;
