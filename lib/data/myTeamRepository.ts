import myTeamData from "@/data/my-team/sample.json";
import type { MyPokemonSet } from "@/types/team";

const myTeam = myTeamData as MyPokemonSet[];

export function listMyPokemonSets(): MyPokemonSet[] {
  return myTeam;
}

export function findMyPokemonSetById(id: string): MyPokemonSet | undefined {
  return myTeam.find((set) => set.id === id);
}
