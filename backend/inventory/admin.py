from django.contrib import admin
from .models import Category, Supplier, Product, StockMovement


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at', 'updated_at')
    search_fields = ('name', 'description')
    list_filter = ('created_at',)


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'email', 'phone', 'created_at')
    search_fields = ('name', 'contact_person', 'email')
    list_filter = ('created_at',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'price', 'quantity', 'min_stock_level', 'category', 'supplier', 'is_active')
    search_fields = ('name', 'sku', 'description')
    list_filter = ('is_active', 'category', 'supplier', 'created_at')
    list_editable = ('quantity', 'is_active')
    readonly_fields = ('created_at', 'updated_at')

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('category', 'supplier')


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('product', 'movement_type', 'quantity', 'reason', 'reference', 'performed_by', 'timestamp')
    search_fields = ('product__name', 'reason', 'reference')
    list_filter = ('movement_type', 'timestamp', 'performed_by')
    readonly_fields = ('timestamp',)
