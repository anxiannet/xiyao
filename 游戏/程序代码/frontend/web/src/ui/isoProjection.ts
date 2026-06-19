export const ISO_W = 96;
export const ISO_H = 48;

export type IsoPoint = {
  x: number;
  y: number;
};

export function isoProject(q: number, r: number): IsoPoint {
  return {
    x: ((q - r) * ISO_W) / 2,
    y: ((q + r) * ISO_H) / 2,
  };
}
