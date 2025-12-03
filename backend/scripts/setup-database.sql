-- PostgreSQL Database Setup Script for IKF Project Livetracker
-- Run this script as a PostgreSQL superuser (usually 'postgres')

-- Create database
CREATE DATABASE plt_db;

-- Connect to the database (this command should be run separately)
-- \c plt_db

-- Note: Prisma will handle table creation via migrations
-- This script only creates the database itself

-- Optional: Create a dedicated user for the application (recommended for production)
-- CREATE USER plt_user WITH PASSWORD 'your_secure_password_here';
-- GRANT ALL PRIVILEGES ON DATABASE plt_db TO plt_user;
-- \c plt_db
-- GRANT ALL ON SCHEMA public TO plt_user;

