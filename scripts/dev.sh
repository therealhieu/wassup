#!/bin/bash

# Load environment variables from .env.local
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Run Next.js dev server with PORT fallback
next dev --turbopack -p ${PORT:-3000}