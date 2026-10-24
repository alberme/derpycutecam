#!/bin/sh
set -eu

echo "Starting CUPS..."
/usr/sbin/cupsd

echo "Waiting for CUPS..."
attempt=0
until lpstat -r 2>/dev/null | grep -q "scheduler is running"; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    echo "CUPS failed to start"
    exit 1
  fi
  sleep 1
done

PRINTER_NAME="${PRINTER_NAME:-CP1500_IPP}"
PRINTER_URI="${PRINTER_URI:-ipp://10.10.10.101:631/ipp/print}"

if ! lpstat -p "$PRINTER_NAME" >/dev/null 2>&1; then
  echo "Creating printer: $PRINTER_NAME"

  lpadmin -p "$PRINTER_NAME" \
    -E \
    -v "$PRINTER_URI" \
    -m everywhere
fi

lpadmin -p "$PRINTER_NAME" \
  -o PageSize=Postcard.Borderless

cupsenable "$PRINTER_NAME"
cupsaccept "$PRINTER_NAME"

echo "Printer configured:"
lpoptions -p "$PRINTER_NAME" -l

echo "Starting Node.js..."
exec node /app/server.js
