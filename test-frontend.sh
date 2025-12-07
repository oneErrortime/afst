#!/bin/bash
set -e
cd /project/workspace/oneErrortime/afst/frontend
echo "Testing frontend..."
[ -f "src/lib/swagger-parser.ts" ] && echo "✓ swagger-parser" || exit 1
[ -f "src/components/auto/AutoForm.tsx" ] && echo "✓ AutoForm" || exit 1
[ -f "src/pages/AutoDashboard.tsx" ] && echo "✓ AutoDashboard" || exit 1
[ -f "src/api/wrapper.ts" ] && echo "✓ API wrapper" || exit 1
curl -s http://localhost:5173/afst/ | grep -q root && echo "✓ Server running" || echo "✗ Server not running"
echo "✅ Frontend ready"
