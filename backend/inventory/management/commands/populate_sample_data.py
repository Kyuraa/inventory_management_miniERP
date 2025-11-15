from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Populate sample data for the inventory system'

    def handle(self, *args, **options):
        from inventory.models import Category, Supplier, Product

        self.stdout.write('Populating sample data...')

        # Create categories
        electronics = Category.objects.get_or_create(
            name='Electronics',
            defaults={'description': 'Electronic devices and accessories'}
        )[0]

        office_supplies = Category.objects.get_or_create(
            name='Office Supplies',
            defaults={'description': 'Stationery and office equipment'}
        )[0]

        # Create suppliers
        tech_supplier = Supplier.objects.get_or_create(
            name='TechCorp Inc',
            defaults={
                'contact_person': 'Steve Johnson',
                'email': 'steve@techcorp.com',
                'phone': '+1-555-0123',
                'address': '123 Tech Street, Silicon Valley, CA 94305'
            }
        )[0]

        office_supplier = Supplier.objects.get_or_create(
            name='Office Solutions',
            defaults={
                'contact_person': 'Sarah Davis',
                'email': 'sarah@officesolutions.com',
                'phone': '+1-555-0456',
                'address': '456 Business Ave, New York, NY 10001'
            }
        )[0]

        # Create sample products
        Product.objects.get_or_create(
            name='Wireless Laptop',
            sku='LT-WR-001',
            defaults={
                'description': '15-inch wireless laptop with 16GB RAM and 512GB SSD',
                'price': 1299.99,
                'quantity': 15,
                'min_stock_level': 5,
                'category': electronics,
                'supplier': tech_supplier,
                'is_active': True
            }
        )

        Product.objects.get_or_create(
            name='Bluetooth Mouse',
            sku='MSE-BT-002',
            defaults={
                'description': 'Wireless Bluetooth mouse with ergonomic design',
                'price': 49.99,
                'quantity': 45,
                'min_stock_level': 10,
                'category': electronics,
                'supplier': tech_supplier,
                'is_active': True
            }
        )

        Product.objects.get_or_create(
            name='USB Keyboard',
            sku='KB-USB-003',
            defaults={
                'description': 'Mechanical USB keyboard with backlit keys',
                'price': 89.99,
                'quantity': 8,
                'min_stock_level': 12,  # Low stock alert
                'category': electronics,
                'supplier': tech_supplier,
                'is_active': True
            }
        )

        Product.objects.get_or_create(
            name='Printer Paper',
            sku='PP-A4-010',
            defaults={
                'description': '500 sheets, A4 size, 80gsm printer paper',
                'price': 12.99,
                'quantity': 25,
                'min_stock_level': 20,
                'category': office_supplies,
                'supplier': office_supplier,
                'is_active': True
            }
        )

        Product.objects.get_or_create(
            name='Desk Lamp',
            sku='LAM-DESK-005',
            defaults={
                'description': 'Adjustable LED desk lamp with USB charging port',
                'price': 39.99,
                'quantity': 2,
                'min_stock_level': 8,  # Low stock alert
                'category': office_supplies,
                'supplier': office_supplier,
                'is_active': True
            }
        )

        self.stdout.write(
            self.style.SUCCESS(
                f'[DEMO] Sample data populated successfully!\n'
                f'[DEMO] Created {Category.objects.count()} categories, {Supplier.objects.count()} suppliers, {Product.objects.count()} products'
            )
        )
