import moveData from "@/data/master/moves.json";
import type { MoveMaster } from "@/types/master";

const moves = moveData as MoveMaster[];

export function listMoves(): MoveMaster[] {
  return moves;
}

export function findMoveByKey(key: number): MoveMaster | undefined {
  return moves.find((move) => move.key === key);
}
