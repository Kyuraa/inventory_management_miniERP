# Inventory Management System

A comprehensive mini ERP (Enterprise Resource Planning) system featuring inventory management, stock tracking, supplier management, and analytics dashboard. Built as a full-stack application with Django REST Framework backend and React frontend.

## Features
- Complete product lifecycle management
- Real-time stock tracking with automatic movement logging
- Supplier and category organization
- Interactive analytics dashboard
- Advanced search, filtering, and export capabilities

## Prerequisites
- Python 3.8+
- Node.js 16+
- pip and npm
- Docker and Docker Compose (optional, for containerized deployment)

## How to Run

### Quick Start (Windows)
1. Download/clone the repository
2. Double-click `start-system.bat`
3. System opens automatically at http://localhost:3000

### Manual Setup
1. **Clone repository and navigate to directory**
   ```bash
   git clone <repository-url>
   cd inventory-management
   ```

2. **Backend setup**
   ```bash
   cd backend
   python -m venv env
   env\Scripts\activate  # Windows
   # source env/bin/activate  # Unix/Mac
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py create_superuser
   python manage.py runserver 8000
   ```

3. **Frontend setup (in separate terminal)**
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Access the application**
   - **Main App**: http://localhost:3000
   - **Admin Panel**: http://localhost:8000/admin
   - **API**: http://localhost:8000/api

### Docker Setup (Recommended for consistent environments)
1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Access the application**
   - **Main App**: http://localhost:3000
   - **Admin Panel**: http://localhost:8000/admin
   - **API**: http://localhost:8000/api

3. **Run commands in containers (if needed)**
   ```bash
   # Run migrations
   docker-compose exec backend python manage.py migrate
   
   # Create superuser
   docker-compose exec backend python manage.py createsuperuser
   
   # Collect static files
   docker-compose exec backend python manage.py collectstatic --noinput
   ```

4. **Adding Static Files**
   Static files can be added to the `frontend/public/static` directory. These files will be automatically served by the nginx server at the `/static/` endpoint. For example:
   - Add CSS files to `frontend/public/static/`
   - Add JavaScript files to `frontend/public/static/`
   - Add images to `frontend/public/static/images/`
   
   After adding files, rebuild the Docker containers:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

5. **Stop the application**
   ```bash
   docker-compose down
   ```

## Tech Stack
- **Backend**: Django + Django REST Framework
- **Frontend**: React + Bootstrap
- **Database**: SQLite (development) / PostgreSQL (Docker)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Permission
This software is provided "as is" with no warranties. You are free to use, modify, distribute, and sublicense this software for any purpose, commercial or personal.