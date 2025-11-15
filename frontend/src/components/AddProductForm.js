import React, { useState, useEffect } from 'react';
import apiService from '../api';
import 'bootstrap/dist/css/bootstrap.min.css';

const AddProductForm = ({ show, handleClose, onProductAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    quantity: '',
    min_stock_level: '',
    category: '',
    supplier: '',
    image: null,
    is_active: true,
  });
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (show) {
      fetchCategoriesAndSuppliers();
    }
  }, [show]);

  const fetchCategoriesAndSuppliers = async () => {
    try {
      const [categoriesResponse, suppliersResponse] = await Promise.all([
        apiService.getCategories(),
        apiService.getSuppliers(),
      ]);
      setCategories(categoriesResponse.data);
      setSuppliers(suppliersResponse.data);
    } catch (error) {
      setFetchError('Failed to load categories and suppliers');
      console.error('Error fetching data:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file' && files && files.length > 0) {
      setFormData(prev => ({
        ...prev,
        image: files[0],
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.price) newErrors.price = 'Price is required';
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.supplier) newErrors.supplier = 'Supplier is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity) || 0,
        min_stock_level: parseInt(formData.min_stock_level) || 0,
      };

      await apiService.createProduct(payload);
      handleClose();
      onProductAdded();
      // Reset form
      setFormData({
        name: '',
        sku: '',
        description: '',
        price: '',
        quantity: '',
        min_stock_level: '',
        category: '',
        supplier: '',
        image: null,
        is_active: true,
      });
      setErrors({});
    } catch (error) {
      console.error('Error creating product:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add New Product</h5>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {fetchError && (
                <div className="alert alert-danger">
                  {fetchError}
                </div>
              )}

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Product Name *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter product name"
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="sku" className="form-label">SKU *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.sku ? 'is-invalid' : ''}`}
                      id="sku"
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      placeholder="Enter SKU"
                    />
                    {errors.sku && <div className="invalid-feedback">{errors.sku}</div>}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  className="form-control"
                  id="description"
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter product description"
                />
              </div>

              <div className="row">
                <div className="col-md-3">
                  <div className="mb-3">
                    <label htmlFor="price" className="form-label">Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                    {errors.price && <div className="invalid-feedback">{errors.price}</div>}
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="mb-3">
                    <label htmlFor="quantity" className="form-label">Quantity</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      id="quantity"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="mb-3">
                    <label htmlFor="min_stock_level" className="form-label">Min Stock Level</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      id="min_stock_level"
                      name="min_stock_level"
                      value={formData.min_stock_level}
                      onChange={handleChange}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="mb-3">
                    <label className="form-check-label d-block">Active</label>
                    <input
                      type="checkbox"
                      className="form-check-input ms-1"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="category" className="form-label">Category *</label>
                    <select
                      className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.category && <div className="invalid-feedback">{errors.category}</div>}
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="supplier" className="form-label">Supplier *</label>
                    <select
                      className={`form-select ${errors.supplier ? 'is-invalid' : ''}`}
                      id="supplier"
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleChange}
                    >
                      <option value="">Select a supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                    {errors.supplier && <div className="invalid-feedback">{errors.supplier}</div>}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="image" className="form-label">Product Image</label>
                <input
                  type="file"
                  className="form-control"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleChange}
                />
                <small className="form-text text-muted">Optional: Upload a product image (JPG, PNG, GIF)</small>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Saving...
                  </>
                ) : (
                  'Add Product'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProductForm;
