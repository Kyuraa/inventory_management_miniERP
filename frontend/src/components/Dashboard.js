import React, { useState, useEffect } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import apiService from '../api';
import 'bootstrap/dist/css/bootstrap.min.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [productsRes, movementsRes, categoriesRes, suppliersRes] = await Promise.all([
        apiService.getProducts(),
        apiService.getStockMovements({ limit: 10 }),
        apiService.getCategories(),
        apiService.getSuppliers(),
      ]);

      setProducts(productsRes.data.results || productsRes.data);
      setStockMovements(movementsRes.data.results || movementsRes.data);
      setCategories(categoriesRes.data.results || categoriesRes.data);
      setSuppliers(suppliersRes.data.results || suppliersRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate dashboard metrics
  const getLowStockProducts = () => {
    return products.filter(product => product.is_active && product.quantity <= product.min_stock_level);
  };

  const getTotalInventoryValue = () => {
    return products
      .filter(product => product.is_active)
      .reduce((total, product) => total + (product.price * product.quantity), 0);
  };

  const getActiveProductsCount = () => {
    return products.filter(product => product.is_active).length;
  };

  const getStockLevelsByCategory = () => {
    const categoryData = {};
    products
      .filter(product => product.is_active)
      .forEach(product => {
        const categoryName = product.category_name || 'Uncategorized';
        if (!categoryData[categoryName]) {
          categoryData[categoryName] = { total: 0, count: 0 };
        }
        categoryData[categoryName].total += product.quantity;
        categoryData[categoryName].count += 1;
      });
    return categoryData;
  };

  const getStockMovementsByDate = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }

    const movementData = {};
    stockMovements.forEach(movement => {
      const date = movement.timestamp.split('T')[0];
      if (!movementData[date]) {
        movementData[date] = { IN: 0, OUT: 0, ADJ: 0 };
      }
      movementData[date][movement.movement_type] += movement.quantity;
    });

    return last7Days.map(date => ({
      date,
      IN: movementData[date]?.IN || 0,
      OUT: movementData[date]?.OUT || 0,
      ADJ: Math.abs(movementData[date]?.ADJ || 0),
    }));
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  // Data for charts
  const lowStockProducts = getLowStockProducts();
  const stockLevelsData = getStockLevelsByCategory();
  const movementsData = getStockMovementsByDate();

  const barChartData = {
    labels: Object.keys(stockLevelsData),
    datasets: [{
      label: 'Stock Quantity by Category',
      data: Object.values(stockLevelsData).map(cat => cat.total),
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
    }]
  };

  const lineChartData = {
    labels: movementsData.map(day => day.date),
    datasets: [
      {
        label: 'Stock In',
        data: movementsData.map(day => day.IN),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
      {
        label: 'Stock Out',
        data: movementsData.map(day => day.OUT),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
      },
      {
        label: 'Adjustments',
        data: movementsData.map(day => day.ADJ),
        borderColor: 'rgba(255, 206, 86, 1)',
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        tension: 0.1,
      }
    ]
  };

  const doughnutData = {
    labels: ['Stock In', 'Stock Out', 'Adjustments'],
    datasets: [{
      data: [
        stockMovements.filter(m => m.movement_type === 'IN').reduce((sum, m) => sum + m.quantity, 0),
        stockMovements.filter(m => m.movement_type === 'OUT').reduce((sum, m) => sum + m.quantity, 0),
        Math.abs(stockMovements.filter(m => m.movement_type === 'ADJ').reduce((sum, m) => sum + m.quantity, 0))
      ],
      backgroundColor: [
        'rgba(75, 192, 192, 0.6)',
        'rgba(255, 99, 132, 0.6)',
        'rgba(255, 206, 86, 0.6)',
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(255, 206, 86, 1)',
      ],
      borderWidth: 1,
    }]
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Inventory Dashboard</h2>

      {/* Key Metrics Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h5 className="card-title">Total Products</h5>
              <h3 className="card-text">{getActiveProductsCount()}</h3>
              <small>Active products in catalog</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h5 className="card-title">Inventory Value</h5>
              <h3 className="card-text">${getTotalInventoryValue().toLocaleString()}</h3>
              <small>Total current value</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <h5 className="card-title">Low Stock Alert</h5>
              <h3 className="card-text">{lowStockProducts.length}</h3>
              <small>Products need restocking</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <h5 className="card-title">Recent Movements</h5>
              <h3 className="card-text">{stockMovements.length}</h3>
              <small>Total stock transactions</small>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Stock Movements (Last 7 Days)</h5>
            </div>
            <div className="card-body">
              <Line
                data={lineChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: { display: true, text: 'Quantity' }
                    },
                    x: {
                      title: { display: true, text: 'Date' }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Movement Types</h5>
            </div>
            <div className="card-body">
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="row mb-4">
        <div className="col-md-7">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Stock Levels by Category</h5>
            </div>
            <div className="card-body">
              <Bar
                data={barChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: { display: true, text: 'Quantity' }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
        <div className="col-md-5">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Low Stock Alert</h5>
            </div>
            <div className="card-body">
              {lowStockProducts.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Current</th>
                        <th>Min</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockProducts.slice(0, 5).map(product => (
                        <tr key={product.id} className="table-warning">
                          <td>{product.name}</td>
                          <td className="text-danger fw-bold">{product.quantity}</td>
                          <td>{product.min_stock_level}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {lowStockProducts.length > 5 && (
                    <p className="text-muted small">And {lowStockProducts.length - 5} more...</p>
                  )}
                </div>
              ) : (
                <div className="text-center text-success">
                  <i className="bi bi-check-circle-fill fs-1 mb-2"></i>
                  <p>All products are well stocked!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
