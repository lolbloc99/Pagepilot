import { getDb } from "./mongodb";

export interface ShopDoc {
  _id?: string;
  shopId: string;
  name: string;
  domain: string;
  clientId: string;
  clientSecret: string;
  accessToken: string;
  scopes: string;
  addedAt: Date;
  updatedAt: Date;
}

async function collection() {
  const db = await getDb();
  return db.collection<ShopDoc>("shops");
}

export async function getAllShops(): Promise<ShopDoc[]> {
  const col = await collection();
  return col.find({}).sort({ addedAt: -1 }).toArray();
}

export async function getShopByDomain(domain: string): Promise<ShopDoc | null> {
  const col = await collection();
  return col.findOne({ domain });
}

export async function getShopById(shopId: string): Promise<ShopDoc | null> {
  const col = await collection();
  return col.findOne({ shopId });
}

export async function upsertShop(shop: Omit<ShopDoc, "_id" | "updatedAt">): Promise<void> {
  const col = await collection();
  const { addedAt, ...rest } = shop;
  await col.updateOne(
    { domain: shop.domain },
    {
      $set: {
        ...rest,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        addedAt: addedAt || new Date(),
      },
    },
    { upsert: true }
  );
}

export async function removeShopByDomain(domain: string): Promise<void> {
  const col = await collection();
  await col.deleteOne({ domain });
}
