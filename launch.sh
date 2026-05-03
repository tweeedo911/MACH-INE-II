#!/bin/bash
# app/launch.sh — wrapper per machine-launch.command (launcher definitivo)
# Fonte di verità: ../machine-launch.command
exec "$(cd "$(dirname "$0")/.." && pwd)/machine-launch.command" "$@"
