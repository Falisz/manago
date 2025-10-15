
#!/bin/bash

# Check for 'backend' alias in current shell
ALIAS_CMD="alias backend='bash $(realpath ./backend.sh)'"
if ! alias backend 2>/dev/null | grep -q "$(realpath ./backend.sh)"; then
    # Add alias to ~/.bashrc if not present
    if ! grep -q "alias backend=" ~/.bashrc; then
        echo "$ALIAS_CMD" >> ~/.bashrc
        echo "Added 'backend' alias to ~/.bashrc."
    fi
    # Resource bashrc
    source ~/.bashrc
    echo "Resourced ~/.bashrc."
fi

# Check for systemctl or service
if command -v systemctl &>/dev/null; then
    PG_STATUS=$(systemctl is-active postgresql)
    if [[ "$PG_STATUS" != "active" ]]; then
        echo "PostgreSQL is not active. Starting with systemctl..."
        sudo systemctl start postgresql
    else
        echo "PostgreSQL is active (systemctl)."
    fi
elif command -v service &>/dev/null; then
    STATUS=$(sudo service postgresql status | tail -1)
    if [[ "$STATUS" == *"down" ]]; then
        echo "PostgreSQL is down. Starting service..."
        sudo service postgresql start
    elif [[ "$STATUS" == *"online" ]]; then
        echo "PostgreSQL is online."
    else
        echo "Unknown PostgreSQL status: $STATUS"
    fi
else
    echo "Neither systemctl nor service command found. Cannot check PostgreSQL status."
fi

cd /workspaces/staff_portal/backend && npm run dev