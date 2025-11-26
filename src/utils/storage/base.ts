/**
 * 通用缓存管理API
 * 提供基础的localStorage操作方法
 */

/**
 * 保存数据到localStorage
 * @param key 存储键名
 * @param data 要存储的数据
 */
export function setStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * 从localStorage加载数据
 * @param key 存储键名
 * @param defaultValue 默认值
 * @returns 存储的数据或默认值
 */
export function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  
  try {
    return JSON.parse(stored) as T;
  } catch (e) {
    console.error(`Failed to parse storage data for key: ${key}`, e);
    return defaultValue;
  }
}

/**
 * 更新localStorage中的数据
 * @param key 存储键名
 * @param updater 更新函数
 * @param defaultValue 默认值
 */
export function updateStorage<T>(key: string, updater: (prev: T) => T, defaultValue: T): void {
  const current = getStorage(key, defaultValue);
  const updated = updater(current);
  setStorage(key, updated);
}

/**
 * 删除localStorage中的数据
 * @param key 存储键名
 */
export function removeStorage(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

/**
 * 清空localStorage中的所有数据
 */
export function clearStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.clear();
}

/**
 * 检查localStorage中是否存在指定键名的数据
 * @param key 存储键名
 * @returns 是否存在
 */
export function hasStorage(key: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(key) !== null;
}
