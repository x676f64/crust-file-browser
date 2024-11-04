import { set, get, keys, del } from 'idb-keyval';

export const saveFile = async (cid, fileData) => {
  await set(cid, fileData);
};

export const getFile = async (cid) => {
  return await get(cid);
};

export const getAllFiles = async () => {
  const fileKeys = await keys();
  const files = await Promise.all(
    fileKeys.map(async (key) => ({
      cid: key,
      data: await get(key),
    }))
  );
  return files;
};

export const deleteFile = async (cid) => {
  await del(cid);
};
