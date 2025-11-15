import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import apiService from './api';

// Mock the API service
jest.mock('./api', () => ({
  getProducts: jest.fn(),
  getCategories: jest.fn(),
  getSuppliers: jest.fn(),
}));

// Mock Chart.js to avoid canvas rendering issues
jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  LineElement: jest.fn(),
  PointElement: jest.fn(),
  ArcElement: jest.fn(),
  Title: [],
  Tooltip: [],
  Legend: [],
}));

const mockApiData = {
  products: [
    {
      id: 1,
      name: 'Test Product',
      sku: 'TEST001',
      price: 99.99,
      quantity: 10,
      min_stock_level: 5,
      category: 'Electronics',
      supplier: 'Test Supplier',
      image: null,
      is_active: true,
    },
  ],
  categories: [
    { id: 1, name: 'Electronics', description: 'Electronic items' },
  ],
  suppliers: [
    { id: 1, name: 'Test Supplier', email: 'test@test.com' },
  ],
};

describe('App Component', () => {
  beforeEach(() => {
    // Setup mock API responses
    apiService.getProducts.mockResolvedValue({ data: mockApiData.products });
    apiService.getCategories.mockResolvedValue({ data: mockApiData.categories });
    apiService.getSuppliers.mockResolvedValue({ data: mockApiData.suppliers });

    // Mock window.matchMedia for Bootstrap responsive components
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // Deprecated
        removeListener: jest.fn(), // Deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', async () => {
    render(<App />);

    // Check that the dashboard is loaded (root redirects to dashboard)
    await waitFor(() => {
      expect(screen.getByText('Inventory Dashboard')).toBeInTheDocument();
    });
  });

  test('displays navigation menu', async () => {
    render(<App />);

    // Check for navigation links
    await waitFor(() => {
      expect(screen.getByText('Inventory Management')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Suppliers')).toBeInTheDocument();
    });
  });

  test('can navigate between sections', async () => {
    render(<App />);

    // Initially on dashboard
    await waitFor(() => {
      expect(screen.getByText('Inventory Dashboard')).toBeInTheDocument();
    });

    // Navigate to products
    const productsLink = screen.getByText('Products');
    fireEvent.click(productsLink);

    // Check that products section loads
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
  });

  test('dashboard shows total products count', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Total Products')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // 1 active product
    });
  });

  test('dashboard shows inventory value', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Inventory Value')).toBeInTheDocument();
      expect(screen.getByText('$999.90')).toBeInTheDocument(); // 99.99 * 10 = 999.90
    });
  });

  test('dashboard shows low stock alerts', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Low Stock Alert')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // Product has quantity 10 > min_stock_level 5
    });
  });
});
