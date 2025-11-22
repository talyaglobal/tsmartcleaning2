#!/bin/bash
# Gamification System Migration Script
# This script safely migrates the database to add gamification tables

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-tsmartcleaning}"
DB_USER="${DB_USER:-postgres}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
MIGRATION_FILE="scripts/35_gamification_system.sql"
ROLLBACK_FILE="scripts/35_gamification_system_rollback.sql"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        log_error "psql is not installed. Please install PostgreSQL client tools."
        exit 1
    fi
    
    # Check if migration file exists
    if [ ! -f "$MIGRATION_FILE" ]; then
        log_error "Migration file not found: $MIGRATION_FILE"
        exit 1
    fi
    
    # Check database connection
    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &> /dev/null; then
        log_error "Cannot connect to database. Please check your connection settings."
        exit 1
    fi
    
    log_info "Prerequisites check passed."
}

# Create backup
create_backup() {
    log_info "Creating database backup..."
    
    BACKUP_FILE="$BACKUP_DIR/gamification_backup_$(date +%Y%m%d_%H%M%S).sql"
    mkdir -p "$BACKUP_DIR"
    
    if PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"; then
        log_info "Backup created: $BACKUP_FILE"
        echo "$BACKUP_FILE" > "$BACKUP_DIR/latest_backup.txt"
    else
        log_error "Failed to create backup"
        exit 1
    fi
}

# Check if tables already exist
check_existing_tables() {
    log_info "Checking for existing gamification tables..."
    
    TABLE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'gamification_points',
            'gamification_points_transactions',
            'gamification_badges',
            'user_badges',
            'gamification_levels',
            'gamification_leaderboards',
            'gamification_challenges',
            'challenge_participants'
        );
    " | xargs)
    
    if [ "$TABLE_COUNT" -gt 0 ]; then
        log_warn "Some gamification tables already exist ($TABLE_COUNT tables found)"
        read -p "Do you want to continue? This will use IF NOT EXISTS clauses. (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Migration cancelled by user"
            exit 0
        fi
    fi
}

# Run migration
run_migration() {
    log_info "Running migration..."
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE"; then
        log_info "Migration completed successfully"
    else
        log_error "Migration failed"
        exit 1
    fi
}

# Verify migration
verify_migration() {
    log_info "Verifying migration..."
    
    TABLE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'gamification%' 
        OR table_name IN ('user_badges', 'challenge_participants');
    " | xargs)
    
    if [ "$TABLE_COUNT" -ge 8 ]; then
        log_info "Migration verified: $TABLE_COUNT tables created"
    else
        log_warn "Expected at least 8 tables, found $TABLE_COUNT"
    fi
    
    # Check RLS policies
    POLICY_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'gamification%';
    " | xargs)
    
    log_info "RLS policies created: $POLICY_COUNT"
}

# Main execution
main() {
    log_info "Starting gamification system migration..."
    log_info "Database: $DB_NAME on $DB_HOST:$DB_PORT"
    
    check_prerequisites
    check_existing_tables
    create_backup
    run_migration
    verify_migration
    
    log_info "Migration completed successfully!"
    log_info "Backup location: $(cat $BACKUP_DIR/latest_backup.txt 2>/dev/null || echo 'N/A')"
}

# Run main function
main

