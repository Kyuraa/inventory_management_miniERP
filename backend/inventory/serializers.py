from rest_framework import serializers
from .models import Category, Supplier, Product, StockMovement


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact_person', 'email', 'phone', 'address', 'created_at', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'description', 'price', 'quantity', 'min_stock_level',
            'category', 'category_name', 'supplier', 'supplier_name', 'image', 'is_active',
            'created_at', 'updated_at', 'is_low_stock'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'name', 'sku', 'description', 'price', 'quantity', 'min_stock_level',
            'category', 'supplier', 'image', 'is_active'
        ]


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            'id', 'product', 'product_name', 'quantity', 'movement_type', 'reason',
            'reference', 'performed_by', 'timestamp'
        ]
        read_only_fields = ['timestamp']

    def validate_quantity(self, value):
        """Ensure quantity is not negative"""
        if value <= 0:
            raise serializers.ValidationError("Quantity must be positive")
        return value
