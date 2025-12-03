#!/bin/bash

# PostgreSQL Database Setup Script for IKF Project Livetracker
# This script automates the database setup process

set -e

echo "🚀 Setting up PostgreSQL database for IKF Project Livetracker..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
DB_NAME="plt_db"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD:-}"
CREATE_USER=false
NEW_USER="plt_user"
NEW_USER_PASSWORD=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --db-name)
      DB_NAME="$2"
      shift 2
      ;;
    --db-user)
      DB_USER="$2"
      shift 2
      ;;
    --db-password)
      DB_PASSWORD="$2"
      shift 2
      ;;
    --create-app-user)
      CREATE_USER=true
      NEW_USER="${2:-plt_user}"
      shift 2
      ;;
    --app-user-password)
      NEW_USER_PASSWORD="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --db-name NAME              Database name (default: plt_db)"
      echo "  --db-user USER              PostgreSQL user (default: postgres)"
      echo "  --db-password PASSWORD      PostgreSQL password"
      echo "  --create-app-user USER      Create dedicated app user (default: plt_user)"
      echo "  --app-user-password PASS    Password for app user (required if --create-app-user)"
      echo "  -h, --help                  Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL client (psql) is not installed.${NC}"
    echo "Please install PostgreSQL first."
    exit 1
fi

# Check if database exists
if psql -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo -e "${YELLOW}⚠️  Database '$DB_NAME' already exists.${NC}"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Dropping existing database..."
        psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"
    else
        echo -e "${GREEN}✅ Using existing database '$DB_NAME'${NC}"
        exit 0
    fi
fi

# Set PGPASSWORD if provided
if [ -n "$DB_PASSWORD" ]; then
    export PGPASSWORD="$DB_PASSWORD"
fi

# Create database
echo "Creating database '$DB_NAME'..."
psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" || {
    echo -e "${RED}❌ Failed to create database.${NC}"
    echo "Please check your PostgreSQL connection settings."
    exit 1
}

echo -e "${GREEN}✅ Database '$DB_NAME' created successfully!${NC}"

# Create application user if requested
if [ "$CREATE_USER" = true ]; then
    if [ -z "$NEW_USER_PASSWORD" ]; then
        echo -e "${RED}❌ Error: --app-user-password is required when using --create-app-user${NC}"
        exit 1
    fi
    
    echo "Creating application user '$NEW_USER'..."
    psql -U "$DB_USER" -c "CREATE USER $NEW_USER WITH PASSWORD '$NEW_USER_PASSWORD';" || {
        echo -e "${YELLOW}⚠️  User might already exist, continuing...${NC}"
    }
    
    psql -U "$DB_USER" -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $NEW_USER;"
    psql -U "$DB_USER" -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $NEW_USER;"
    
    echo -e "${GREEN}✅ Application user '$NEW_USER' created and granted privileges!${NC}"
    echo -e "${YELLOW}📝 Update your DATABASE_URL to use: postgresql://$NEW_USER:$NEW_USER_PASSWORD@localhost:5432/$DB_NAME${NC}"
fi

# Unset PGPASSWORD
unset PGPASSWORD

echo ""
echo -e "${GREEN}🎉 Database setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your DATABASE_URL"
echo "2. Run: cd backend && npx prisma generate"
echo "3. Run: cd backend && npx prisma migrate dev"
echo "4. Run: cd backend && npx prisma db seed"

