#!/bin/bash

# Check for 'frontend' alias in current shell
ALIAS_CMD="alias frontend='bash $(realpath ./frontend.sh)'"
if ! alias frontend 2>/dev/null | grep -q "$(realpath ./frontend.sh)"; then
    # Add alias to ~/.bashrc if not present
    if ! grep -q "alias frontend=" ~/.bashrc; then
        echo "$ALIAS_CMD" >> ~/.bashrc
        echo "Added 'frontend' alias to ~/.bashrc."
    fi
    # Resource bashrc
    source ~/.bashrc
    echo "Resourced ~/.bashrc."
fi

cd /workspaces/staff_portal/frontend && npm start