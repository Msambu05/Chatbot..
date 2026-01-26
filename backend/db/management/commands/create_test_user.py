from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Create a test user for development'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, default='admin@test.com', help='User email')
        parser.add_argument('--password', type=str, default='admin123', help='User password')
        parser.add_argument('--is-admin', action='store_true', help='Make user admin/superuser')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        is_admin = options['is_admin']

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f'User with email {email} already exists'))
            return

        # Create user
        if is_admin:
            user = User.objects.create_superuser(
                username=email.split('@')[0],
                email=email,
                password=password
            )
            self.stdout.write(self.style.SUCCESS(f'Superuser {email} created successfully'))
        else:
            user = User.objects.create_user(
                username=email.split('@')[0],
                email=email,
                password=password
            )
            self.stdout.write(self.style.SUCCESS(f'User {email} created successfully'))

        self.stdout.write(self.style.SUCCESS(f'Password: {password}'))
