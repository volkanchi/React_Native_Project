import axios from 'axios';

const API_URL = 'https://servis-takip-api-anir.onrender.com/api'; 

export const api = axios.create({
  baseURL: API_URL,
});

// Her istekten önce çalışır ve localStorage'daki token'ı ekler
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});