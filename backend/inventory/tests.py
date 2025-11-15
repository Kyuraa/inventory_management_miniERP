import json
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Category, Product, Supplier, StockMovement


class ModelTests(TestCase):
    """Test the Django models"""

    def setUp(self):
        """Set up test data"""
        self.category = Category.objects.create(
            name="Test Category",
            description="Test description"
        )
        self.supplier = Supplier.objects.create(
            name="Test Supplier",
            contact_person="John Doe",
            email="test@example.com"
        )
        self.product = Product.objects.create(
            name="Test Product",
            sku="TEST001",
            price=99.99,
            quantity=10,
            category=self.category,
            supplier=self.supplier
        )

    def test_category_creation(self):
        """Test category model creation"""
        self.assertEqual(self.category.name, "Test Category")
        self.assertEqual(str(self.category), "Test Category")

    def test_supplier_creation(self):
        """Test supplier model creation"""
        self.assertEqual(self.supplier.name, "Test Supplier")
        self.assertEqual(self.supplier.email, "test@example.com")

    def test_product_creation(self):
        """Test product model creation"""
        self.assertEqual(self.product.name, "Test Product")
        self.assertEqual(self.product.sku, "TEST001")
        self.assertEqual(self.product.quantity, 10)
        self.assertEqual(str(self.product), "Test Product (TEST001)")

    def test_stock_movement_on_quantity_change(self):
        """Test that stock movements are created when quantity changes"""
        initial_movements = StockMovement.objects.count()

        # Change product quantity
        self.product.quantity = 15
        self.product.save()

        # Check that a stock movement was created
        final_movements = StockMovement.objects.count()
        self.assertEqual(final_movements, initial_movements + 1)

        # Check the movement details
        movement = StockMovement.objects.last()
        self.assertEqual(movement.product, self.product)
        self.assertEqual(movement.movement_type, 'IN')
        self.assertEqual(movement.quantity, 5)  # 15 - 10

    def test_product_low_stock_property(self):
        """Test the low stock property"""
        # Set min_stock_level higher than quantity
        self.product.min_stock_level = 15
        self.product.save()

        self.assertTrue(self.product.is_low_stock())

        # Set min_stock_level lower than quantity
        self.product.min_stock_level = 5
        self.product.save()

        self.assertFalse(self.product.is_low_stock())


class APITests(APITestCase):
    """Test the REST API endpoints"""

    def setUp(self):
        """Set up test data"""
        self.category = Category.objects.create(
            name="Test Category",
            description="Test description"
        )
        self.supplier = Supplier.objects.create(
            name="Test Supplier",
            contact_person="John Doe",
            email="test@example.com"
        )
    @property
    def api_product_data(self):
        """Product data formatted for API calls (with IDs instead of model instances)"""
        return {
            'name': 'API Test Product',
            'sku': 'APITEST001',
            'description': 'Test product for API testing',
            'price': '29.99',
            'quantity': 5,
            'min_stock_level': 1,
            'category': self.category.id,
            'supplier': self.supplier.id,
            'is_active': True
        }

    def test_category_api_list(self):
        """Test listing categories via API"""
        url = reverse('category-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_category_api_create(self):
        """Test creating a category via API"""
        url = reverse('category-list')
        data = {'name': 'New Category', 'description': 'New description'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Category.objects.count(), 2)

    def test_supplier_api_list(self):
        """Test listing suppliers via API"""
        url = reverse('supplier-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_product_api_list(self):
        """Test listing products via API"""
        url = reverse('product-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_product_api_create(self):
        """Test creating a product via API"""
        url = reverse('product-list')
        response = self.client.post(url, self.api_product_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 1)

    def test_product_api_detail(self):
        """Test retrieving a product via API"""
        # Create product first - use model instances for Django ORM
        product_data = {
            'name': 'API Test Product',
            'sku': 'APITEST001',
            'description': 'Test product for API testing',
            'price': 29.99,
            'quantity': 5,
            'min_stock_level': 1,
            'category': self.category,
            'supplier': self.supplier,
            'is_active': True
        }
        product = Product.objects.create(**product_data)

        url = reverse('product-detail', args=[product.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'API Test Product')

    def test_product_api_update(self):
        """Test updating a product via API"""
        # Create product first - use model instances for Django ORM
        product_data = {
            'name': 'API Test Product',
            'sku': 'APITEST001',
            'description': 'Test product for API testing',
            'price': 29.99,
            'quantity': 5,
            'min_stock_level': 1,
            'category': self.category,
            'supplier': self.supplier,
            'is_active': True
        }
        product = Product.objects.create(**product_data)

        url = reverse('product-detail', args=[product.id])
        updated_data = self.api_product_data.copy()
        updated_data['name'] = 'Updated Product Name'

        response = self.client.put(url, updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        product.refresh_from_db()
        self.assertEqual(product.name, 'Updated Product Name')

    def test_product_api_delete(self):
        """Test deleting a product via API"""
        # Create product first - use model instances for Django ORM
        product_data = {
            'name': 'API Test Product',
            'sku': 'APITEST001',
            'description': 'Test product for API testing',
            'price': 29.99,
            'quantity': 5,
            'min_stock_level': 1,
            'category': self.category,
            'supplier': self.supplier,
            'is_active': True
        }
        product = Product.objects.create(**product_data)

        url = reverse('product-detail', args=[product.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Product.objects.count(), 0)

    def test_csv_export(self):
        """Test CSV export functionality"""
        # Create a product first - use model instances for Django ORM
        product_data = {
            'name': 'API Test Product',
            'sku': 'APITEST001',
            'description': 'Test product for API testing',
            'price': 29.99,
            'quantity': 5,
            'min_stock_level': 1,
            'category': self.category,
            'supplier': self.supplier,
            'is_active': True
        }
        Product.objects.create(**product_data)

        url = reverse('product-export-csv')
        response = self.client.get(url)

        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')

        # Check that content includes expected product data
        csv_content = response.content.decode('utf-8')
        self.assertIn('API Test Product', csv_content)
        self.assertIn('APITEST001', csv_content)

    def test_stock_movement_api_list(self):
        """Test listing stock movements via API"""
        url = reverse('stockmovement-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
