from django.db import models
from django.core.exceptions import ValidationError


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class Supplier(models.Model):
    name = models.CharField(max_length=100, unique=True)
    contact_person = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField(default=0)
    min_stock_level = models.IntegerField(default=0)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.sku})"

    def save(self, *args, **kwargs):
        # Check if this is a stock adjustment request
        create_movement = kwargs.pop('create_movement', True)
        custom_reason = kwargs.pop('stock_reason', None)

        # Track stock movement on quantity change (unless disabled)
        if create_movement and self.pk:
            try:
                old_product = Product.objects.get(pk=self.pk)
                if old_product.quantity != self.quantity:
                    quantity_change = self.quantity - old_product.quantity
                    movement_type = 'IN' if quantity_change > 0 else 'OUT'
                    StockMovement.objects.create(
                        product=self,
                        quantity=abs(quantity_change),
                        movement_type=movement_type,
                        reason=custom_reason or 'Quantity updated via admin/form',
                        reference=f'Stock adjustment - {self.pk}',
                        performed_by='User'
                    )
            except Product.DoesNotExist:
                pass  # New product, no movement needed

        super().save(*args, **kwargs)

    def clean(self):
        if self.quantity < 0:
            raise ValidationError('Quantity cannot be negative')
        if self.price < 0:
            raise ValidationError('Price cannot be negative')

    def is_low_stock(self):
        return self.quantity <= self.min_stock_level


class StockMovement(models.Model):
    MOVEMENT_TYPES = [
        ('IN', 'Stock In'),
        ('OUT', 'Stock Out'),
        ('ADJ', 'Adjustment'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    movement_type = models.CharField(max_length=3, choices=MOVEMENT_TYPES)
    reason = models.CharField(max_length=200, blank=True)
    reference = models.CharField(max_length=100, blank=True)  # Purchase/Sale order number
    performed_by = models.CharField(max_length=100, blank=True)  # User who performed action
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Stock Movement"
        verbose_name_plural = "Stock Movements"

    def __str__(self):
        return f"{self.movement_type} {self.quantity} x {self.product.name} on {self.timestamp.date()}"

    def clean(self):
        if self.movement_type in ['OUT', 'ADJ'] and self.quantity > self.product.quantity and self.movement_type != 'ADJ':
            raise ValidationError('Cannot remove more stock than available')
