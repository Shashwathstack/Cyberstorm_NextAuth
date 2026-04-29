#!/bin/bash

echo "🔐 NexAuth is starting..."
echo "💻 Backend:   http://localhost:4000"
echo "📊 Dashboard: http://localhost:3000"
echo "🌐 Open demo/index.html to see the demo"
echo "✅ Everything is running!"

# Using npx concurrently so it works without requiring global install
npx concurrently -k -p "[{name}]" -n "Backend,Dashboard,DemoServer" -c "cyan.bold,magenta.bold,yellow.bold" \
  "node server/index.js" \
  "cd dashboard && npm start" \
  "npx serve -p 5500 ."
