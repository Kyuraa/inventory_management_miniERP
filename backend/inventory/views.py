import csv
from django.http import HttpResponse
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Supplier, Product, StockMovement
from .serializers import (
    CategorySerializer, SupplierSerializer, ProductSerializer,
    ProductCreateUpdateSerializer, StockMovementSerializer
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'contact_person', 'email']


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category', 'supplier').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'supplier', 'is_active']
    search_fields = ['name', 'sku', 'description']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductCreateUpdateSerializer
        return ProductSerializer

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export products to CSV"""
        products = self.get_queryset()

        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="products.csv"'

        writer = csv.writer(response)
        # Write header
        writer.writerow([
            'SKU', 'Name', 'Description', 'Price', 'Quantity',
            'Min Stock Level', 'Category', 'Supplier', 'Active',
            'Created At', 'Updated At'
        ])

        # Write data
        for product in products:
            writer.writerow([
                product.sku,
                product.name,
                product.description or '',
                product.price,
                product.quantity,
                product.min_stock_level,
                product.category.name if product.category else '',
                product.supplier.name if product.supplier else '',
                'Yes' if product.is_active else 'No',
                product.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                product.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
            ])

        return response

    @action(detail=True, methods=['post'])
    def adjust_stock(self, request, pk=None):
        """Adjust stock for a specific product"""
        product = self.get_object()

        adjustment_type = request.data.get('adjustment_type')
        quantity = request.data.get('quantity')
        reason = request.data.get('reason', '')

        if not adjustment_type or not quantity:
            return Response(
                {'error': 'adjustment_type and quantity are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            quantity = int(quantity)
        except ValueError:
            return Response(
                {'error': 'quantity must be a valid integer'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity <= 0:
            return Response(
                {'error': 'quantity must be greater than 0'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if adjustment_type == 'subtract' and quantity > product.quantity:
            return Response(
                {'error': f'Cannot remove more than current stock ({product.quantity})'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Calculate new quantity
            new_quantity = product.quantity + quantity if adjustment_type == 'add' else product.quantity - quantity

            # Update product with custom reason - this will create a stock movement
            product.quantity = new_quantity
            product.save(stock_reason=reason)  # Pass reason to model

            # Refresh product data
            product.refresh_from_db()

            # Return updated product data
            serializer = self.get_serializer(product)
            return Response({
                'message': f'Stock adjusted successfully',
                'product': serializer.data
            })

        except Exception as e:
            return Response(
                {'error': f'Failed to adjust stock: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.select_related('product').all()
    serializer_class = StockMovementSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['movement_type', 'product']
    search_fields = ['reason', 'reference', 'performed_by']
