// src/lib/fetchOwned.ts
import { ro } from "@/lib/contracts";

/**
 * ERC721Enumerable 기반: balanceOf + tokenOfOwnerByIndex 로 보유 토큰 ID 전량 조회
 * - 과도한 동시 호출을 막기 위해 배치로 나눠 요청
 * - 반환: bigint[] (tokenIds)
 */
export async function fetchOwnedByEnumerable(addr: string): Promise<bigint[]> {
  if (!addr) return [];

  const bal: bigint = await ro.ADV.balanceOf(addr);
  if (bal === BigInt(0)) return [];

  const ids: bigint[] = [];
  const BATCH = BigInt(20); // 동시 20개씩(너의 RPC 상황에 따라 10~50 사이로 조절)

  for (let i = BigInt(0); i < bal; i += BATCH) {
    const end = i + (i + BATCH > bal ? (bal - i) : BATCH);
    const reqs: Promise<bigint>[] = [];
    for (let j = i; j < end; j++) {
      // ethers v6는 bigint 인자를 그대로 받는다
      reqs.push(ro.ADV.tokenOfOwnerByIndex(addr, j) as Promise<bigint>);
    }
    const part = await Promise.all(reqs);
    for (const id of part) ids.push(id);
  }
  return ids;
}

/**
 * tokenIds 에 대해 gradeOf 조회 (배치 처리)
 * - 반환: Map<tokenId, gradeNumber>
 */
export async function fetchGradesFor(ids: bigint[]): Promise<Map<bigint, number>> {
  const out = new Map<bigint, number>();
  if (!ids.length) return out;

  const BATCH = 25; // 동시 25개씩
  for (let i = 0; i < ids.length; i += BATCH) {
    const chunk = ids.slice(i, i + BATCH);
    const reqs = chunk.map(id => ro.ADV.gradeOf(id) as Promise<number>);
    const grades = await Promise.all(reqs);
    for (let k = 0; k < chunk.length; k++) {
      out.set(chunk[k], Number(grades[k] ?? 0));
    }
  }
  return out;
}