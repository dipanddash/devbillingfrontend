/**
 * Online-only cache stubs.
 */

export async function cacheCategories(_categories: unknown[]): Promise<void> { return; }
export async function cacheProducts(_products: unknown[]): Promise<void> { return; }
export async function cacheAddons(_addons: unknown[]): Promise<void> { return; }
export async function cacheCombos(_combos: unknown[]): Promise<void> { return; }
export async function cacheCustomers(_customers: unknown[]): Promise<void> { return; }
export async function cacheTables(_tables: unknown[]): Promise<void> { return; }
export async function cacheOrders(_orders: unknown[]): Promise<void> { return; }
export async function cacheOrderDetail(_order: unknown): Promise<void> { return; }
export async function cacheSnapshot(_snapshot: unknown): Promise<void> { return; }

export async function getCachedOrders(): Promise<unknown[]> { return []; }
export async function getCachedOrderDetail(_orderId: string): Promise<unknown | null> { return null; }
export async function getCachedCategories(): Promise<unknown[]> { return []; }
export async function getCachedProducts(): Promise<unknown[]> { return []; }
export async function getCachedAddons(): Promise<unknown[]> { return []; }
export async function getCachedCombos(): Promise<unknown[]> { return []; }
export async function getCachedCustomers(): Promise<unknown[]> { return []; }
export async function getLastSnapshotTime(): Promise<string | null> { return null; }
