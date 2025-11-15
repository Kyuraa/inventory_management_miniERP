import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth headers later
api.interceptors.request.use(
  (config) => {
    // Add auth headers here when implementing JWT
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API functions
const apiService = {
  // Products
  getProducts: (params = {}) => api.get('/products/', { params }),
  createProduct: (data) => api.post('/products/', data),
  updateProduct: (id, data) => api.put(`/products/${id}/`, data),
  deleteProduct: (id) => api.delete(`/products/${id}/`),
  exportProductsCSV: () => api.get('/products/export_csv/', {
    responseType: 'blob',
    headers: { 'Accept': 'text/csv' }
  }),
  adjustStock: (productId, data) => api.post(`/products/${productId}/adjust_stock/`, data),

  // Categories
  getCategories: (params = {}) => api.get('/categories/', { params }),
  createCategory: (data) => api.post('/categories/', data),
  updateCategory: (id, data) => api.put(`/categories/${id}/`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}/`),

  // Suppliers
  getSuppliers: (params = {}) => api.get('/suppliers/', { params }),
  createSupplier: (data) => api.post('/suppliers/', data),
  updateSupplier: (id, data) => api.put(`/suppliers/${id}/`, data),
  deleteSupplier: (id) => api.delete(`/suppliers/${id}/`),

  // Stock Movements
  getStockMovements: (params = {}) => api.get('/stock-movements/', { params }),
  createStockMovement: (data) => api.post('/stock-movements/', data),
};

export default apiService;
