import React, { useState, useEffect } from 'react';
import apiService from '../api';
import 'bootstrap/dist/css/bootstrap.min.css';

const CategoryFormModal = ({ show, handleClose, category, onCategorySaved }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (show) {
      if (category) {
        setFormData({
          name: category.name || '',
          description: category.description || '',
        });
      } else {
        setFormData({
          name: '',
          description: '',
        });
      }
      setErrors({});
      setFetchError('');
    }
  }, [show, category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Category name is required';
    if (formData.name.length < 2) newErrors.name = 'Category name must be at least 2 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (category) {
        await apiService.updateCategory(category.id, formData);
      } else {
        await apiService.createCategory(formData);
      }
      handleClose();
      onCategorySaved();
    } catch (error) {
      console.error('Error saving category:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
      } else {
        setFetchError('Failed to save category');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{category ? 'Edit Category' : 'Add New Category'}</h5>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {fetchError && (
                <div className="alert alert-danger">
                  {fetchError}
                </div>
              )}
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Category Name *</label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter category name"
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
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
                  placeholder="Enter category description (optional)"
                />
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
                  category ? 'Update Category' : 'Add Category'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const refreshCategories = async () => {
    try {
      const response = await apiService.getCategories({ search: searchTerm });
      setCategories(response.data.results || response.data);
    } catch (err) {
      console.error('Error refreshing categories:', err);
    }
  };

  const handleCategoryAdded = () => {
    refreshCategories();
    setSuccessMessage('Category added successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleCategoryUpdated = () => {
    refreshCategories();
    setSuccessMessage('Category updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? This may affect products using this category.')) {
      try {
        await apiService.deleteCategory(categoryId);
        refreshCategories();
        setSuccessMessage('Category deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error deleting category:', err);
        setError('Failed to delete category');
      }
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await apiService.getCategories({ search: searchTerm });
        setCategories(response.data.results || response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch categories');
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  if (loading && categories.length === 0) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Categories</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          Add Category
        </button>
      </div>

      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
        </div>
      )}

      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">
                  No categories found
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.description || '-'}</td>
                  <td>{new Date(category.created_at).toLocaleDateString()}</td>
                  <td>{new Date(category.updated_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-1 mb-1"
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowEditModal(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger mb-1"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {loading && categories.length > 0 && (
        <div className="text-center mt-3">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Refresh...</span>
          </div>
        </div>
      )}

      <CategoryFormModal
        show={showAddModal}
        handleClose={() => setShowAddModal(false)}
        category={null}
        onCategorySaved={handleCategoryAdded}
      />

      <CategoryFormModal
        show={showEditModal}
        handleClose={() => setShowEditModal(false)}
        category={selectedCategory}
        onCategorySaved={handleCategoryUpdated}
      />
    </div>
  );
};

export default CategoryList;
