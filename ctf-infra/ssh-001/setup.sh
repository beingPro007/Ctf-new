#!/bin/bash
# Setup script - runs as root at container start

# Create flag hidden in .bashrc history trick
mkdir -p /home/ctfuser/.secret
echo "CTF{bash_history_and_hidden_files_0xff}" > /home/ctfuser/.secret/.flag
chmod 400 /home/ctfuser/.secret/.flag
chown ctfuser:ctfuser /home/ctfuser/.secret/.flag

# Put a base64 encoded clue in .bashrc
echo 'export HINT=$(echo "dHJ5OiBmaW5kIC8gaC1uYW1lIC5mbGFnIDI+L2Rldi9udWxs" | base64 -d)' >> /home/ctfuser/.bashrc

# Another flag in suid binary backups
mkdir -p /opt/backup
echo "CTF{suid_find_privesc_0x1234}" > /root/root_flag.txt
chmod 400 /root/root_flag.txt

# Create a vulnerable SUID binary (just a bash script wrapper for demo)
cat > /opt/backup/reader.sh << 'EOF'
#!/bin/bash
# This script runs as root via SUID
cat "$1"
EOF
chmod 4755 /opt/backup/reader.sh

# Interesting files to find
echo "db_password=S3cr3tDB!Pass" > /var/log/app.conf
echo "api_key=sk-1234567890abcdef" >> /var/log/app.conf
chmod 644 /var/log/app.conf

# Start SSH
/usr/sbin/sshd -D
