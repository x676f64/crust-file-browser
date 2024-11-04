import { set, get, keys, del } from 'idb-keyval';

const HISTORY_KEY = 'search_history';
const MAX_HISTORY = 10;

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

// Search history functions
export const getSearchHistory = async () => {
  try {
    const history = await get(HISTORY_KEY) || [];
    return history;
  } catch (error) {
    console.error('Error getting search history:', error);
    return [];
  }
};

export const addToHistory = async (address) => {
  try {
    let history = await get(HISTORY_KEY) || [];
    
    // Remove if already exists
    history = history.filter(addr => addr !== address);
    
    // Add to beginning
    history.unshift(address);
    
    // Keep only last MAX_HISTORY items
    history = history.slice(0, MAX_HISTORY);
    
    await set(HISTORY_KEY, history);
    return history;
  } catch (error) {
    console.error('Error adding to search history:', error);
    return [];
  }
};

export const clearHistory = async () => {
  try {
    await del(HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
};