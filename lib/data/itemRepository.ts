import itemData from "@/data/master/items.json";
import type { ItemMaster } from "@/types/master";

const items = itemData as ItemMaster[];

export function listItems(): ItemMaster[] {
  return items;
}

export function findItemByKey(key?: number): ItemMaster | undefined {
  if (key === undefined) return undefined;
  return items.find((item) => item.key === key);
}
