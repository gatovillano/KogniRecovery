#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
START_SCRIPT="$ROOT_DIR/start-prod.sh"
SERVICE_NAME="kognirecovery.service"
SERVICE_PATH="/etc/systemd/system/$SERVICE_NAME"
RUN_USER="${SUDO_USER:-${USER}}"
RUN_GROUP="$(id -gn "$RUN_USER")"
RUN_HOME="$(getent passwd "$RUN_USER" | cut -d: -f6)"
SUDO_CMD=""

if ! command -v systemctl > /dev/null 2>&1; then
  echo "❌ systemctl no está disponible en este sistema"
  exit 1
fi

if [ ! -f "$START_SCRIPT" ]; then
  echo "❌ No se encontró $START_SCRIPT"
  exit 1
fi

if [ "$(id -u)" -ne 0 ]; then
  if ! command -v sudo > /dev/null 2>&1; then
    echo "❌ Necesitas sudo o ejecutar este script como root"
    exit 1
  fi
  SUDO_CMD="sudo"
fi

chmod +x "$START_SCRIPT"

cat <<EOF | $SUDO_CMD tee "$SERVICE_PATH" > /dev/null
[Unit]
Description=KogniRecovery production backend
After=network-online.target docker.service
Wants=network-online.target docker.service
Requires=docker.service

[Service]
Type=simple
User=$RUN_USER
Group=$RUN_GROUP
WorkingDirectory=$ROOT_DIR
Environment=HOME=$RUN_HOME
Environment=NODE_ENV=production
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ExecStart=/bin/bash $START_SCRIPT run
Restart=always
RestartSec=10
TimeoutStartSec=600
TimeoutStopSec=30
KillMode=control-group
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

$SUDO_CMD systemctl daemon-reload
$SUDO_CMD systemctl enable --now "$SERVICE_NAME"
$SUDO_CMD systemctl status "$SERVICE_NAME" --no-pager --lines=20
