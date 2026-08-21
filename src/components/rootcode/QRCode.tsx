import React, { useMemo } from "react";

/**
 * Pure TypeScript, zero-dependency QR Code SVG Generator.
 * Strict TypeScript compliant with noUncheckedIndexedAccess.
 */

const EXP_TABLE: number[] = new Array(512).fill(0);
const LOG_TABLE: number[] = new Array(256).fill(0);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    EXP_TABLE[i + 255] = x;
    LOG_TABLE[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  const logX = LOG_TABLE[x] ?? 0;
  const logY = LOG_TABLE[y] ?? 0;
  return EXP_TABLE[logX + logY] ?? 0;
}

function rsGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    const factor = EXP_TABLE[i] ?? 0;
    for (let j = 0; j < poly.length; j++) {
      const pVal = poly[j] ?? 0;
      next[j] = (next[j] ?? 0) ^ gfMul(pVal, factor);
      next[j + 1] = (next[j + 1] ?? 0) ^ pVal;
    }
    poly = next;
  }
  return poly;
}

function rsCompute(data: number[], ecCount: number): number[] {
  const gen = rsGeneratorPoly(ecCount);
  const res = new Array(ecCount).fill(0);
  for (let i = 0; i < data.length; i++) {
    const factor = (data[i] ?? 0) ^ (res[0] ?? 0);
    for (let j = 0; j < ecCount - 1; j++) {
      const gVal = gen[j + 1] ?? 0;
      res[j] = (res[j + 1] ?? 0) ^ gfMul(gVal, factor);
    }
    const gLast = gen[ecCount] ?? 0;
    res[ecCount - 1] = gfMul(gLast, factor);
  }
  return res;
}

interface VersionInfo {
  totalCodewords: number;
  ecPerBlock: number;
  numBlocks: number;
}

const VERSION_TABLE: Record<number, VersionInfo> = {
  1: { totalCodewords: 26, ecPerBlock: 10, numBlocks: 1 },
  2: { totalCodewords: 44, ecPerBlock: 16, numBlocks: 1 },
  3: { totalCodewords: 70, ecPerBlock: 26, numBlocks: 1 },
  4: { totalCodewords: 100, ecPerBlock: 18, numBlocks: 2 },
  5: { totalCodewords: 134, ecPerBlock: 24, numBlocks: 2 },
  6: { totalCodewords: 172, ecPerBlock: 16, numBlocks: 4 },
  7: { totalCodewords: 196, ecPerBlock: 18, numBlocks: 4 },
  8: { totalCodewords: 242, ecPerBlock: 22, numBlocks: 4 },
  9: { totalCodewords: 292, ecPerBlock: 22, numBlocks: 5 },
  10: { totalCodewords: 346, ecPerBlock: 26, numBlocks: 5 },
};

const ALIGNMENT_LOCATIONS: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
};

function generateQRMatrix(text: string): boolean[][] {
  const encoder = new TextEncoder();
  const rawBytes = Array.from(encoder.encode(text));
  const dataLen = rawBytes.length;

  let version = 1;
  while (version < 10) {
    const vInfo = VERSION_TABLE[version] ?? { totalCodewords: 26, ecPerBlock: 10, numBlocks: 1 };
    const dataCw = vInfo.totalCodewords - vInfo.ecPerBlock * vInfo.numBlocks;
    const maxDataBytes = dataCw - (version < 10 ? 2 : 3);
    if (dataLen <= maxDataBytes) break;
    version++;
  }

  const vInfo = VERSION_TABLE[version] ?? { totalCodewords: 26, ecPerBlock: 10, numBlocks: 1 };
  const totalDataCodewords = vInfo.totalCodewords - vInfo.ecPerBlock * vInfo.numBlocks;

  const bits: number[] = [];
  const appendBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  appendBits(0b0100, 4);
  appendBits(dataLen, version < 10 ? 8 : 16);
  for (const b of rawBytes) {
    appendBits(b, 8);
  }

  const maxBits = totalDataCodewords * 8;
  const termLen = Math.min(4, Math.max(0, maxBits - bits.length));
  for (let i = 0; i < termLen; i++) bits.push(0);

  while (bits.length % 8 !== 0) bits.push(0);

  const dataBytes: number[] = new Array(totalDataCodewords).fill(0);
  for (let i = 0; i < bits.length / 8 && i < totalDataCodewords; i++) {
    let byteVal = 0;
    for (let j = 0; j < 8; j++) {
      byteVal = (byteVal << 1) | (bits[i * 8 + j] ?? 0);
    }
    dataBytes[i] = byteVal;
  }

  const PAD = [0xec, 0x11];
  let padIdx = 0;
  for (let i = Math.floor(bits.length / 8); i < totalDataCodewords; i++) {
    dataBytes[i] = PAD[padIdx % 2] ?? 0xec;
    padIdx++;
  }

  const blockSize = Math.floor(totalDataCodewords / vInfo.numBlocks);
  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];

  let offset = 0;
  for (let b = 0; b < vInfo.numBlocks; b++) {
    const curBlockSize =
      blockSize + (b >= vInfo.numBlocks - (totalDataCodewords % vInfo.numBlocks) ? 1 : 0);
    const blockData = dataBytes.slice(offset, offset + curBlockSize);
    offset += curBlockSize;
    dataBlocks.push(blockData);
    ecBlocks.push(rsCompute(blockData, vInfo.ecPerBlock));
  }

  const finalCodewords: number[] = [];
  const maxDataBlockLen = Math.max(...dataBlocks.map((d) => d.length));
  for (let i = 0; i < maxDataBlockLen; i++) {
    for (let b = 0; b < vInfo.numBlocks; b++) {
      const block = dataBlocks[b];
      if (block && i < block.length) {
        finalCodewords.push(block[i] ?? 0);
      }
    }
  }
  for (let i = 0; i < vInfo.ecPerBlock; i++) {
    for (let b = 0; b < vInfo.numBlocks; b++) {
      const ecBlock = ecBlocks[b];
      if (ecBlock && i < ecBlock.length) {
        finalCodewords.push(ecBlock[i] ?? 0);
      }
    }
  }

  const size = version * 4 + 17;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setModule = (r: number, c: number, val: boolean, isFunc = false) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      const row = matrix[r];
      const funcRow = isFunction[r];
      if (row && funcRow) {
        row[c] = val;
        if (isFunc) funcRow[c] = true;
      }
    }
  };

  const drawFinder = (topRow: number, leftCol: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = topRow + r;
        const col = leftCol + c;
        if (row < 0 || row >= size || col < 0 || col >= size) continue;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isBlack =
            r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          setModule(row, col, isBlack, true);
        } else {
          setModule(row, col, false, true);
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    setModule(6, i, i % 2 === 0, true);
    setModule(i, 6, i % 2 === 0, true);
  }

  const alignCoords = ALIGNMENT_LOCATIONS[version] ?? [];
  for (const r of alignCoords) {
    for (const c of alignCoords) {
      const funcRow = isFunction[r];
      if (funcRow && funcRow[c]) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isBlack =
            Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
          setModule(r + dr, c + dc, isBlack, true);
        }
      }
    }
  }

  setModule(size - 8, 8, true, true);

  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      setModule(8, i, false, true);
      setModule(i, 8, false, true);
    }
  }
  for (let i = 0; i < 8; i++) {
    setModule(8, size - 1 - i, false, true);
    setModule(size - 1 - i, 8, false, true);
  }

  const allDataBits: number[] = [];
  for (const cw of finalCodewords) {
    for (let i = 7; i >= 0; i--) {
      allDataBits.push((cw >> i) & 1);
    }
  }

  let bitIdx = 0;
  let upward = true;
  for (let rightCol = size - 1; rightCol > 0; rightCol -= 2) {
    if (rightCol === 6) rightCol--;
    for (let vert = 0; vert < size; vert++) {
      const r = upward ? size - 1 - vert : vert;
      for (let c = rightCol; c >= rightCol - 1; c--) {
        const funcRow = isFunction[r];
        if (funcRow && !funcRow[c]) {
          const bit = bitIdx < allDataBits.length ? (allDataBits[bitIdx++] ?? 0) : 0;
          const mask = (r + c) % 2 === 0;
          const moduleValue = (bit === 1) !== mask;
          setModule(r, c, moduleValue);
        }
      }
    }
    upward = !upward;
  }

  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  const formatSeqTop: Array<[number, number]> = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];
  const formatSeqSplit: Array<[number, number]> = [
    [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8], [size - 5, 8], [size - 6, 8], [size - 7, 8],
    [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5], [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1],
  ];

  for (let i = 0; i < 15; i++) {
    const val = formatBits[i] === 1;
    const topPair = formatSeqTop[i];
    if (topPair) {
      const r = topPair[0];
      const c = topPair[1];
      const row = matrix[r];
      if (row) row[c] = val;
    }
    const splitPair = formatSeqSplit[i];
    if (splitPair) {
      const r = splitPair[0];
      const c = splitPair[1];
      const row = matrix[r];
      if (row) row[c] = val;
    }
  }

  return matrix;
}

export interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCode({ value, size = 180, className = "" }: QRCodeProps) {
  const matrix = useMemo(() => {
    try {
      return generateQRMatrix(value);
    } catch {
      return null;
    }
  }, [value]);

  if (!matrix) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground ${className}`}
      >
        QR Code unavailable
      </div>
    );
  }

  const modCount = matrix.length;
  const cellSize = 10;
  const padding = 16;
  const svgDimension = modCount * cellSize + padding * 2;

  let pathData = "";
  for (let r = 0; r < modCount; r++) {
    const row = matrix[r];
    if (!row) continue;
    for (let c = 0; c < modCount; c++) {
      if (row[c]) {
        const x = padding + c * cellSize;
        const y = padding + r * cellSize;
        pathData += `M${x},${y}h${cellSize}v${cellSize}h-${cellSize}z `;
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${svgDimension} ${svgDimension}`}
      width={size}
      height={size}
      className={`rounded-lg bg-white p-2 shadow-sm ${className}`}
      role="img"
      aria-label={`QR Code for ${value}`}
    >
      <rect width={svgDimension} height={svgDimension} fill="#ffffff" rx="8" />
      <path d={pathData} fill="#1a3826" />
    </svg>
  );
}
