import axios from 'axios';

export const GATEWAY_URL = 'https://gw.crustgw.work/ipfs';

export const getFileInfo = async (cid) => {
  try {
    const response = await axios.head(`${GATEWAY_URL}/${cid}`, {
      validateStatus: function (status) {
        return status < 500; // Accept all responses except server errors
      }
    });
    
    return {
      contentType: response.headers['content-type'],
      contentLength: response.headers['content-length'],
      status: response.status
    };
  } catch (error) {
    console.error('Error fetching file info:', error);
    return null;
  }
};

export const getFileContent = async (cid, maxSize = 1024 * 50) => { // Max 50KB for preview
  try {
    const response = await axios.get(`${GATEWAY_URL}/${cid}`, {
      responseType: 'arraybuffer',
      headers: {
        'Range': `bytes=0-${maxSize - 1}` // Request only first portion
      },
      validateStatus: function (status) {
        return status < 500;
      }
    });
    
    return {
      data: response.data,
      contentType: response.headers['content-type'],
      contentLength: response.headers['content-length']
    };
  } catch (error) {
    console.error('Error fetching file content:', error);
    return null;
  }
};