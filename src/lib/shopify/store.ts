"use client";

export interface ShopifyShop {
  id: string;
  name: string;
  domain: string;
  accessToken: string;
  addedAt: string;
}

const STORAGE_KEY = "pageforge_shops";
const ACTIVE_KEY = "pageforge_active_shop";

export function getShops(): ShopifyShop[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addShop(shop: ShopifyShop): void {
  const shops = getShops();
  const existing = shops.findIndex((s) => s.domain === shop.domain);
  if (existing >= 0) {
    shops[existing] = shop;
  } else {
    shops.push(shop);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shops));
  // Auto-select if first shop
  if (shops.length === 1) {
    setActiveShop(shop.id);
  }
}

export function removeShop(id: string): void {
  const shops = getShops().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shops));
  // Clear active if removed
  if (getActiveShopId() === id) {
    localStorage.removeItem(ACTIVE_KEY);
    if (shops.length > 0) {
      setActiveShop(shops[0].id);
    }
  }
}

export function getActiveShopId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveShop(id: string): void {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function getActiveShop(): ShopifyShop | null {
  const id = getActiveShopId();
  if (!id) return null;
  return getShops().find((s) => s.id === id) || null;
}
