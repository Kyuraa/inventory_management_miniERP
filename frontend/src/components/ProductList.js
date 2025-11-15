import React, { useState, useEffect } from 'react';
import apiService from '../api';
import AddProductForm from './AddProductForm';
import EditProductForm from './EditProductForm';
import StockAdjustmentForm from './StockAdjustmentForm';
import 'bootstrap/dist/css/bootstrap.min.css';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Store all fetched products
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const refreshProducts = async () => {
    try {
      const response = await apiService.getProducts();
      const allProductsData = response.data.results || response.data;
      setAllProducts(allProductsData);
    } catch (err) {
      console.error('Error refreshing products:', err);
    }
  };

  const handleProductAdded = () => {
    refreshProducts();
    setSuccessMessage('Product added successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleProductUpdated = () => {
    refreshProducts();
    setSuccessMessage('Product updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleStockUpdated = () => {
    refreshProducts();
    setSuccessMessage('Stock updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleExportCSV = async () => {
    try {
      const response = await apiService.exportProductsCSV();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccessMessage('CSV export downloaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      setError('Failed to export CSV');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await apiService.deleteProduct(productId);
        refreshProducts();
        setSuccessMessage('Product deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error deleting product:', err);
        setError('Failed to delete product');
      }
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await apiService.getProducts();
        const allProductsData = response.data.results || response.data;
        setAllProducts(allProductsData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch products');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    // Filter and sort products based on search term and sort settings
    let filtered = allProducts;

    if (searchTerm) {
      filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category_name && product.category_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.supplier_name && product.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort products
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle null/undefined values
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      // Handle different data types
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setProducts(filtered);
    setCurrentPage(1); // Reset to first page when filtering/sorting changes
  }, [allProducts, searchTerm, sortField, sortDirection]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = products.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading && products.length === 0) {
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
        <h2 className="mb-0">Products</h2>
        <div>
          <button
            className="btn btn-outline-secondary me-2"
            onClick={handleExportCSV}
          >
            Export CSV
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            Add Product
          </button>
        </div>
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
          placeholder="Search products..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Products Table */}
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>Image</th>
              <th style={{cursor: 'pointer'}} onClick={() => handleSort('name')}>
                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{cursor: 'pointer'}} onClick={() => handleSort('sku')}>
                SKU {sortField === 'sku' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{cursor: 'pointer'}} onClick={() => handleSort('price')}>
                Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{cursor: 'pointer'}} onClick={() => handleSort('quantity')}>
                Quantity {sortField === 'quantity' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Min Stock</th>
              <th>Category</th>
              <th>Supplier</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center">
                  No products found
                </td>
              </tr>
            ) : (
              paginatedProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="img-thumbnail"
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className="bg-light text-muted d-flex align-items-center justify-content-center"
                        style={{ width: '50px', height: '50px', borderRadius: '0.25rem' }}
                      >
                        No Image
                      </div>
                    )}
                  </td>
                  <td>{product.name}</td>
                  <td>{product.sku}</td>
                  <td>${product.price}</td>
                  <td className={product.quantity <= product.min_stock_level ? 'text-danger fw-bold' : ''}>
                    {product.quantity}
                  </td>
                  <td>{product.min_stock_level}</td>
                  <td>{product.category_name}</td>
                  <td>{product.supplier_name}</td>
                  <td>
                    <span className={`badge ${product.is_active ? 'bg-success' : 'bg-secondary'}`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-success me-1 mb-1"
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowStockModal(true);
                      }}
                    >
                      Stock
                    </button>
                    <button
                      className="btn btn-sm btn-outline-primary me-1 mb-1"
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowEditModal(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger mb-1"
                      onClick={() => handleDeleteProduct(product.id)}
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

      {/* Pagination Controls */}
      {products.length > itemsPerPage && (
        <nav aria-label="Products pagination" className="mt-4">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
            </li>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (pageNum > totalPages) return null;
              return (
                <li key={pageNum} className={`page-item ${pageNum === currentPage ? 'active' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                </li>
              );
            })}

            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </li>
          </ul>

          <div className="text-center mt-2">
            <small className="text-muted">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, products.length)} of {products.length} products
            </small>
          </div>
        </nav>
      )}

      {loading && products.length > 0 && (
        <div className="text-center mt-3">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Refresh...</span>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      <AddProductForm
        show={showAddModal}
        handleClose={() => setShowAddModal(false)}
        onProductAdded={handleProductAdded}
      />

      {/* Edit Product Modal */}
      <EditProductForm
        show={showEditModal}
        handleClose={() => setShowEditModal(false)}
        product={selectedProduct}
        onProductUpdated={handleProductUpdated}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentForm
        show={showStockModal}
        handleClose={() => setShowStockModal(false)}
        product={selectedProduct}
        onStockUpdated={handleStockUpdated}
      />
    </div>
  );
};

export default ProductList;
