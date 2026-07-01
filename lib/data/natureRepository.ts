import natureData from "@/data/master/natures.json";
import type { NatureMaster } from "@/types/master";

const natures = natureData as NatureMaster[];

export function listNatures(): NatureMaster[] {
  return natures;
}

export function findNatureByKey(key: number): NatureMaster | undefined {
  return natures.find((nature) => nature.key === key);
}
