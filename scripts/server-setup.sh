#!/usr/bin/env bash
#
# WaelderBytes ERP V2 - Server-Grundsetup (Ubuntu 24.04)
# Installiert: Docker + Compose Plugin, UFW (Firewall), fail2ban, legt Deploy-User an.
# Angelehnt an server-setup.sh aus ERP v1, auf Ubuntu statt Debian angepasst.
#
# Nutzung: als root ausfuehren
#   bash server-setup.sh
#
set -euo pipefail

DEPLOY_USER="waelderbytes"

echo "==> System aktualisieren"
apt update && apt upgrade -y

echo "==> Docker installieren (Ubuntu-Repo)"
apt install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "==> Docker Version:"
docker --version
docker compose version

echo "==> Git installieren"
apt install -y git

echo "==> UFW (Firewall) installieren und konfigurieren"
apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable
ufw status verbose

echo "==> fail2ban installieren"
apt install -y fail2ban
cat > /etc/fail2ban/jail.local <<'JAIL'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
JAIL
systemctl enable fail2ban
systemctl restart fail2ban
sleep 3
fail2ban-client status

echo "==> Benutzer '${DEPLOY_USER}' anlegen (statt dauerhaft als root zu arbeiten)"
if id "${DEPLOY_USER}" &>/dev/null; then
  echo "Benutzer '${DEPLOY_USER}' existiert bereits, ueberspringe Anlage."
else
  adduser --disabled-password --gecos "" "${DEPLOY_USER}"
fi
usermod -aG sudo "${DEPLOY_USER}"
usermod -aG docker "${DEPLOY_USER}"

echo "==> SSH-Key von root fuer '${DEPLOY_USER}' uebernehmen"
mkdir -p "/home/${DEPLOY_USER}/.ssh"
if [ -f /root/.ssh/authorized_keys ]; then
  cp /root/.ssh/authorized_keys "/home/${DEPLOY_USER}/.ssh/authorized_keys"
else
  echo "WARNUNG: /root/.ssh/authorized_keys nicht gefunden - Key manuell fuer ${DEPLOY_USER} hinterlegen!"
  touch "/home/${DEPLOY_USER}/.ssh/authorized_keys"
fi
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "/home/${DEPLOY_USER}/.ssh"
chmod 700 "/home/${DEPLOY_USER}/.ssh"
chmod 600 "/home/${DEPLOY_USER}/.ssh/authorized_keys"

echo ""
echo "=================================================================="
echo "Fertig. NAECHSTE SCHRITTE (manuell, siehe README-Ausgabe unten):"
echo "1. In einem NEUEN Terminal pruefen, ob Login als '${DEPLOY_USER}' per"
echo "   SSH-Key funktioniert: ssh ${DEPLOY_USER}@<server-ip>"
echo "   ERST wenn das klappt, root-Login absichern (naechster Schritt)!"
echo "2. Danach root-Login/Passwort-Login deaktivieren (siehe Schritt 2 in"
echo "   der Anleitung) - NICHT automatisch in diesem Skript, um kein"
echo "   Aussperr-Risiko einzugehen."
echo "=================================================================="
