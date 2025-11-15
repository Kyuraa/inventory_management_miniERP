import React, { useState, useEffect } from 'react';
import apiService from '../api';
import 'bootstrap/dist/css/bootstrap.min.css';

const StockAdjustmentForm = ({ show, handleClose, product, onStockUpdated }) => {
  const [formData, setFormData] = useState({
    adjustment_type: 'add', // 'add' or 'subtract'
    quantity: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show) {
      // Reset form when modal opens
      setFormData({
        adjustment_type: 'add',
        quantity: '',
        reason: '',
      });
      setErrors({});
    }
  }, [show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear field errors when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (formData.adjustment_type === 'subtract' && product && formData.quantity > product.quantity) {
      newErrors.quantity = `Cannot remove more than current stock (${product.quantity})`;
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || !product) return;

    setLoading(true);
    try {
      // Use the dedicated adjust_stock endpoint
      await apiService.adjustStock(product.id, {
        adjustment_type: formData.adjustment_type,
        quantity: parseInt(formData.quantity),
        reason: formData.reason,
      });

      handleClose();
      onStockUpdated();

      setFormData({
        adjustment_type: 'add',
        quantity: '',
        reason: '',
      });
      setErrors({});
    } catch (error) {
      console.error('Error adjusting stock:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
      } else {
        setErrors({ general: 'Failed to update stock' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!show || !product) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Adjust Stock - {product.name}</h5>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <p><strong>Current Stock:</strong> {product.quantity}</p>
              </div>

              {errors.general && (
                <div className="alert alert-danger">
                  {errors.general}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Adjustment Type *</label>
                <select
                  className="form-select"
                  name="adjustment_type"
                  value={formData.adjustment_type}
                  onChange={handleChange}
                >
                  <option value="add">Add to Stock (Stock In)</option>
                  <option value="subtract">Remove from Stock (Stock Out)</option>
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="quantity" className="form-label">
                  Quantity to {formData.adjustment_type === 'add' ? 'Add' : 'Remove'} *
                </label>
                <input
                  type="number"
                  min="1"
                  className={`form-control ${errors.quantity ? 'is-invalid' : ''}`}
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="Enter quantity"
                />
                {errors.quantity && <div className="invalid-feedback">{errors.quantity}</div>}
              </div>

              <div className="mb-3">
                <label htmlFor="reason" className="form-label">Reason *</label>
                <textarea
                  className={`form-control ${errors.reason ? 'is-invalid' : ''}`}
                  id="reason"
                  name="reason"
                  rows="3"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Enter reason for stock adjustment"
                />
                {errors.reason && <div className="invalid-feedback">{errors.reason}</div>}
              </div>

              <div className="alert alert-info">
                <strong>Preview:</strong> Current stock {product.quantity} will become {formData.adjustment_type === 'add' ?
                  product.quantity + (parseInt(formData.quantity) || 0) :
                  Math.max(0, product.quantity - (parseInt(formData.quantity) || 0))}
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
                    Updating...
                  </>
                ) : (
                  `Adjust Stock`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustmentForm;
