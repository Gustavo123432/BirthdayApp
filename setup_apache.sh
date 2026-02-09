#!/bin/bash

# Configuration
DOMAIN="aniversarios.epvc2.local"
PORT=5173
CONFIG_FILE="/etc/apache2/sites-available/birthday-app.conf"

echo "Configuring Apache reverse proxy for $DOMAIN..."

# Enable modules
sudo a2enmod proxy proxy_http proxy_wstunnel

# Create VirtualHost configuration
cat <<EOF | sudo tee $CONFIG_FILE
<VirtualHost *:80>
    ServerName $DOMAIN

    ProxyPreserveHost On
    ProxyPass / http://localhost:$PORT/
    ProxyPassReverse / http://localhost:$PORT/

    # Support for Vite WebSockets
    ProxyPass /@vite/ws ws://localhost:$PORT/@vite/ws
    ProxyPassReverse /@vite/ws ws://localhost:$PORT/@vite/ws
</VirtualHost>
EOF

# Enable site
sudo a2ensite birthday-app.conf

# Restart Apache
sudo systemctl restart apache2

echo "Apache configured successfully!"
echo "App is now accessible via http://$DOMAIN"
