#!/bin/bash

# Quick Database Setup Script
# This script performs all database setup steps in sequence

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Quick Database Setup for IKF Project Livetracker${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}📝 Please update backend/.env with your database credentials${NC}"
        echo -e "${RED}❌ Setup stopped. Please configure .env and run again.${NC}"
        exit 1
    else
        echo -e "${RED}❌ .env.example not found. Cannot create .env file.${NC}"
        exit 1
    fi
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL" .env || grep -q "DATABASE_URL=\"\"" .env; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not configured in .env${NC}"
    echo -e "${RED}❌ Please set DATABASE_URL in backend/.env and run again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment configuration found${NC}"

# Step 1: Generate Prisma Client
echo ""
echo -e "${GREEN}Step 1: Generating Prisma Client...${NC}"
npx prisma generate || {
    echo -e "${RED}❌ Failed to generate Prisma Client${NC}"
    exit 1
}

# Step 2: Run Migrations
echo ""
echo -e "${GREEN}Step 2: Running database migrations...${NC}"
npx prisma migrate dev --name init || {
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
}

# Step 3: Seed Database
echo ""
echo -e "${GREEN}Step 3: Seeding database...${NC}"
npx prisma db seed || {
    echo -e "${YELLOW}⚠️  Seeding failed (this might be okay if data already exists)${NC}"
}

echo ""
echo -e "${GREEN}🎉 Database setup complete!${NC}"
echo ""
echo "Default login credentials:"
echo "  Super Admin: superadmin@ikf.com / password123"
echo "  Admin: admin@ikf.com / password123"
echo "  Project Manager: pm@ikf.com / password123"
echo ""
echo "⚠️  Remember to change these passwords in production!"

