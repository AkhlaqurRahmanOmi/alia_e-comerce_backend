#!/bin/bash

# Start ngrok to expose localhost:4000
# This allows Pesapal to send IPN webhooks to your local backend

echo "Starting ngrok to expose localhost:4000..."
echo ""

# Run ngrok with config file
docker run --rm -d --name ngrok_tunnel --net=host \
  -v $(pwd)/ngrok.yml:/etc/ngrok.yml \
  ngrok/ngrok:latest \
  start --all --config /etc/ngrok.yml

# Wait for ngrok to start
sleep 3

# Get the ngrok URL
echo ""
echo "Fetching ngrok URL..."
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$NGROK_URL" ]; then
  echo "✓ Ngrok is running!"
  echo ""
  echo "Public URL: $NGROK_URL"
  echo ""
  echo "Update your .env file with:"
  echo "PESAPAL_IPN_URL=$NGROK_URL/api/v1/payments/callback/pesapal"
  echo ""
  echo "To stop ngrok: docker stop ngrok_tunnel"
else
  echo "✗ Failed to get ngrok URL. Check: docker logs ngrok_tunnel"
fi

# After ngrok starts, you'll see a URL like:
# https://abcd-1234-5678.ngrok-free.app
#
# IMPORTANT:
# 1. Copy the HTTPS URL from ngrok output
# 2. Update .env file:
#    PESAPAL_IPN_URL=https://YOUR-NGROK-URL.ngrok-free.app/api/v1/payments/callback/pesapal
# 3. Register this IPN URL in Pesapal dashboard
# 4. Restart your backend: npm run start:dev
