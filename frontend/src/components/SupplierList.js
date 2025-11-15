import React, { useState, useEffect } from 'react';
import apiService from '../api';
import 'bootstrap/dist/css/bootstrap.min.css';

const SupplierFormModal = ({ show, handleClose, supplier, onSupplierSaved }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (show) {
      if (supplier) {
        setFormData({
          name: supplier.name || '',
          contact_person: supplier.contact_person || '',
          email: supplier.email || '',
          phone: supplier.phone || '',
          address: supplier.address || '',
        });
      } else {
        setFormData({
          name: '',
          contact_person: '',
          email: '',
          phone: '',
          address: '',
        });
      }
      setErrors({});
      setFetchError('');
    }
  }, [show, supplier]);

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

    if (!formData.name.trim()) newErrors.name = 'Supplier name is required';
    if (formData.name.length < 2) newErrors.name = 'Supplier name must be at least 2 characters';

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (supplier) {
        // Update existing supplier
        await apiService.updateSupplier(supplier.id, formData);
      } else {
        // Create new supplier
        await apiService.createSupplier(formData);
      }
      handleClose();
      onSupplierSaved();
    } catch (error) {
      console.error('Error saving supplier:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
      } else {
        setFetchError('Failed to save supplier');
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
            <h5 className="modal-title">{supplier ? 'Edit Supplier' : 'Add New Supplier'}</h5>
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
                    <label htmlFor="name" className="form-label">Supplier Name *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter supplier name"
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="contact_person" className="form-label">Contact Person</label>
                    <input
                      type="text"
                      className="form-control"
                      id="contact_person"
                      name="contact_person"
                      value={formData.contact_person}
                      onChange={handleChange}
                      placeholder="Enter contact person"
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter email address"
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="phone" className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-control"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="address" className="form-label">Address</label>
                <textarea
                  className="form-control"
                  id="address"
                  name="address"
                  rows="3"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter address (optional)"
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
                  supplier ? 'Update Supplier' : 'Add Supplier'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const refreshSuppliers = async () => {
    try {
      const response = await apiService.getSuppliers({ search: searchTerm });
      setSuppliers(response.data.results || response.data);
    } catch (err) {
      console.error('Error refreshing suppliers:', err);
    }
  };

  const handleSupplierAdded = () => {
    refreshSuppliers();
    setSuccessMessage('Supplier added successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSupplierUpdated = () => {
    refreshSuppliers();
    setSuccessMessage('Supplier updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (window.confirm('Are you sure you want to delete this supplier? This may affect products using this supplier.')) {
      try {
        await apiService.deleteSupplier(supplierId);
        refreshSuppliers();
        setSuccessMessage('Supplier deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error deleting supplier:', err);
        setError('Failed to delete supplier');
      }
    }
  };

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const response = await apiService.getSuppliers({ search: searchTerm });
        setSuppliers(response.data.results || response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch suppliers');
        console.error('Error fetching suppliers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, [searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  if (loading && suppliers.length === 0) {
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
        <h2 className="mb-0">Suppliers</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          Add Supplier
        </button>
      </div>

      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
        </div>
      )}

      {/* Search Input */}
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search suppliers..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Suppliers Table */}
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>Name</th>
              <th>Contact Person</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">
                  No suppliers found
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td>{supplier.name}</td>
                  <td>{supplier.contact_person || '-'}</td>
                  <td>
                    {supplier.email ? (
                      <a href={`mailto:${supplier.email}`} className="text-decoration-none">
                        {supplier.email}
                      </a>
                    ) : '-'}
                  </td>
                  <td>{supplier.phone || '-'}</td>
                  <td>{supplier.address || '-'}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-1 mb-1"
                      onClick={() => {
                        setSelectedSupplier(supplier);
                        setShowEditModal(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger mb-1"
                      onClick={() => handleDeleteSupplier(supplier.id)}
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

      {loading && suppliers.length > 0 && (
        <div className="text-center mt-3">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Refresh...</span>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      <SupplierFormModal
        show={showAddModal}
        handleClose={() => setShowAddModal(false)}
        supplier={null}
        onSupplierSaved={handleSupplierAdded}
      />

      {/* Edit Supplier Modal */}
      <SupplierFormModal
        show={showEditModal}
        handleClose={() => setShowEditModal(false)}
        supplier={selectedSupplier}
        onSupplierSaved={handleSupplierUpdated}
      />
    </div>
  );
};

export default SupplierList;
