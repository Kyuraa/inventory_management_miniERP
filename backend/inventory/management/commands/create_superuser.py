from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Create or update superuser for the inventory system'

    def add_arguments(self, parser):
        parser.add_argument('--username', default='inventory_admin', type=str)
        parser.add_argument('--email', default='admin@inventory.com', type=str)
        parser.add_argument('--password', default='inventory123', type=str)

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']

        # Create or update superuser
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'is_staff': True,
                'is_superuser': True,
            }
        )

        if not created:
            self.stdout.write(f'User {username} already exists, updating password...')
        else:
            self.stdout.write(f'Created superuser {username}')

        # Set password
        user.set_password(password)
        user.save()

        self.stdout.write(
            self.style.SUCCESS(
                f'Superuser ready!\n'
                f'Username: {username}\n'
                f'Password: {password}\n'
                f'Admin URL: http://localhost:8000/admin/'
            )
        )
