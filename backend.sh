
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
    SYSCTL_OUTPUT=$(systemctl is-active postgresql 2>&1) || true

    # Detect the "systemd is not running in this container" message and fall back to 'service'
    if [[ "$SYSCTL_OUTPUT" == *"systemd"* ]]; then
        if [[ "$SYSCTL_OUTPUT" == *"not running"* ]] || [[ "$SYSCTL_OUTPUT" == *"Use the \"service\" command"* ]]; then
            echo "systemctl is not usable in this container; falling back to 'service'..."
            STATUS=$(sudo service postgresql status 2>&1 | tail -1)
            if [[ "$STATUS" == *"down"* ]] || [[ "$STATUS" == *"stopped"* ]]; then
                echo "PostgreSQL is down. Starting service..."
                sudo service postgresql start
            elif [[ "$STATUS" == *"online"* ]] || [[ "$STATUS" == *"running"* ]]; then
                echo "PostgreSQL is online (service)."
            else
                echo "Unknown PostgreSQL status (service): $STATUS"
            fi
            # Skip the systemctl branch since we've handled it via service
            :
        else
            # systemctl seems usable — use the captured status (or re-query if empty)
            PG_STATUS=${SYSCTL_OUTPUT:-$(systemctl is-active postgresql 2>&1 || true)}
            if [[ "$PG_STATUS" != "active" ]]; then
                echo "PostgreSQL is not active. Starting with systemctl..."
                sudo systemctl start postgresql
            else
                echo "PostgreSQL is active (systemctl)."
            fi
        fi
    else
        # No "systemd not running" message; treat captured output as the status
        PG_STATUS=${SYSCTL_OUTPUT:-$(systemctl is-active postgresql 2>&1 || true)}
        if [[ "$PG_STATUS" != "active" ]]; then
            echo "PostgreSQL is not active. Starting with systemctl..."
            sudo systemctl start postgresql
        else
            echo "PostgreSQL is active (systemctl)."
        fi
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