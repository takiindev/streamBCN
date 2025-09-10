import axios from 'axios';
import API_CONFIG from '../config/api';

const API_URL = API_CONFIG.BASE_URL;

export const authService = {
  // Login with student ID and birth date
  async login(studentId, birthDate) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        studentId,
        birthDate,
      }, { withCredentials: true });

      if (response?.data?.user) {
        const userObj = response.data.user;
        const token = response.data.access_token || response.data.token;
        return { ...userObj, access_token: token };
      }
      
      throw new Error('Đăng nhập thất bại');
    } catch (error) {
      throw new Error(error?.response?.data?.message || error.message);
    }
  },

  // Check authentication status
  async verify() {
    try {
      const response = await axios.get(`${API_URL}/auth/verify`, {
        withCredentials: true,
      });

      if (response.data.valid && response.data.user) {
        return response.data.user;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  },

  // Logout
  async logout() {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
};
