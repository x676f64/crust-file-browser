import axios from 'axios';

const API_URL = 'https://crust.webapi.subscan.io';

export const fetchFiles = async (address, page = 0) => {
  try {
    const response = await axios.post(`${API_URL}/api/scan/swork/member/orders`, {
      address,
      all_orders: false,
      page,
      row: 100
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching files:', error);
    throw error;
  }
};

export const GATEWAY_URL = 'https://gw.crustgw.work/ipfs';
