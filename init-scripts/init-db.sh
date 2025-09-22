#!/bin/bash
set -e

echo "Initializing Temperature Service Database..."

# The database temperaturedb is already created by the POSTGRES_DB environment variable
# This script can be used for additional setup if needed

echo "Database initialization completed."