import localforage from "localforage";
import { equals, isEmpty } from "jsmethod-extra";
import { LocalforageTypeEnum } from "./types";

const store1 = localforage.createInstance({
  driver: localforage.INDEXEDDB,
  storeName: "big_file_upload",
});
const store2 = localforage.createInstance({
  driver: localforage.INDEXEDDB,
  storeName: "hash_name_p",
});
type LocalforageType = typeof store1;

export const StoreFactory: Record<LocalforageTypeEnum, LocalforageType> = {
  [LocalforageTypeEnum.p1]: store1,
  [LocalforageTypeEnum.p2]: store2,
};

// 用于加速 key-value 反向查找的索引 Map
const keyValueIndexMap: WeakMap<
  LocalforageType,
  Map<string, string>
> = new WeakMap();

/**
 * 获取或创建指定 store 的索引 Map
 *
 * @author lihh
 * @param store localforage 实例
 */
function getOrCreateIndexMap(store: LocalforageType): Map<string, string> {
  if (!keyValueIndexMap.has(store)) {
    keyValueIndexMap.set(store, new Map());
  }
  return keyValueIndexMap.get(store)!;
}

/**
 * 生成 value 的简单哈希值作为索引键
 * 使用对象的关键属性组合，避免大型对象序列化
 *
 * @author lihh
 * @param value 要哈希的值
 */
function generateValueHashKey(value: unknown): string {
  if (typeof value === "string") return `str:${value}`;
  if (typeof value === "number") return `num:${value}`;
  if (typeof value === "boolean") return `bool:${value}`;
  // 对于复杂对象，使用关键属性的组合
  if (Array.isArray(value)) return `arr:${value.join(",")}`;
  if (typeof value === "object" && value !== null) {
    // 提取对象的关键属性进行哈希
    const keys = Object.keys(value as object)
      .sort()
      .slice(0, 5)
      .join("|");
    return `obj:${keys}`;
  }
  return String(value);
}

/**
 * 删除 item 事件
 *
 * @author lihh
 * @param key 主键 key
 * @param store 使用store 默认的p1
 */
async function deleteItemHandler(
  key: string,
  store = StoreFactory[LocalforageTypeEnum.p1],
) {
  const allKeys = await store.keys();
  if (isEmpty(allKeys) || !allKeys.includes(key)) return;

  // 同步更新索引
  const indexMap = getOrCreateIndexMap(store);
  const value = await store.getItem(key);
  if (value !== null && value !== undefined) {
    const hashKey = generateValueHashKey(value);
    indexMap.delete(hashKey);
  }

  await store.removeItem(key);
}

/**
 * 根据 store 拿到所有的key
 *
 * @author lihh
 * @param store 指定仓库
 */
async function getAllKeysHandler(store = StoreFactory[LocalforageTypeEnum.p1]) {
  return (await store.keys()) || [];
}

/**
 * 拿到全部的item
 *
 * @author lihh
 * @param store 表示默认的 store
 */
async function getAllItemHandler(store = StoreFactory[LocalforageTypeEnum.p1]) {
  /* 首先 判断是否支持 indexedDB */
  if (!store.supports(store.INDEXEDDB)) return null;

  const allKeys = await store.keys();
  if (isEmpty(allKeys)) return null;

  const arrayValues: Record<string, Array<unknown>> = {};
  for (const arrayKey of allKeys) {
    arrayValues[arrayKey] = (await store.getItem(arrayKey)) as Array<unknown>;
  }
  return arrayValues;
}

/**
 * 添加 item事件
 *
 * @author lihh
 * @param key 添加的 key
 * @param value value 的集合
 * @param store 表示默认的 store
 */
async function addItemHandler(
  key: string,
  value: object,
  store = StoreFactory[LocalforageTypeEnum.p1],
) {
  await store.setItem(key, value);

  // 同步更新索引
  const indexMap = getOrCreateIndexMap(store);
  indexMap.set(generateValueHashKey(value), key);
}

/**
 * 通过 key 拿到 item
 *
 * @author lihh
 * @param keyOrValue 可以是key or 是value
 * @param store 默认的store
 */
async function getItemHandler(
  keyOrValue: object,
  store = StoreFactory[LocalforageTypeEnum.p1],
) {
  const allKeys = await store.keys();
  if (isEmpty(allKeys)) return null;

  // 首先检查是否是通过 key 查找
  const keyStr = keyOrValue as unknown as string;
  if (allKeys.includes(keyStr)) {
    return await store.getItem(keyStr);
  }

  // 使用索引 Map 进行反向查找（通过 value 找 key）
  const indexMap = getOrCreateIndexMap(store);
  const hashKey = generateValueHashKey(keyOrValue);

  // 检查索引是否存在
  if (indexMap.has(hashKey)) {
    const foundKey = indexMap.get(hashKey)!;
    return await store.getItem(foundKey);
  }

  // 如果索引不完整，尝试回退到线性搜索并同步索引
  for (const currentKey of allKeys) {
    const currentValue = await store.getItem(currentKey);
    if (equals(currentValue, keyOrValue)) {
      // 同步到索引
      indexMap.set(hashKey, currentKey);
      return currentValue;
    }
  }
  return null;
}

/**
 * 表示全局的store hook
 *
 * @author lihh
 */
export function useStore(): [
  typeof addItemHandler,
  typeof deleteItemHandler,
  typeof getAllItemHandler,
  typeof getItemHandler,
  typeof getAllKeysHandler,
] {
  return [
    addItemHandler,
    deleteItemHandler,
    getAllItemHandler,
    getItemHandler,
    getAllKeysHandler,
  ];
}
