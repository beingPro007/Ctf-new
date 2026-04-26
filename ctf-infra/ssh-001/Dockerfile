FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y openssh-server sudo && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash ctfuser && echo "ctfuser:password123" | chpasswd
RUN mkdir -p /run/sshd

RUN echo "PermitRootLogin no" >> /etc/ssh/sshd_config && \
    echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config && \
    echo "Banner /etc/ssh/banner.txt" >> /etc/ssh/sshd_config

RUN echo "=== CTF Linux Box v1.0 ===" > /etc/ssh/banner.txt && \
    echo "Login: ctfuser | Pass: password123" >> /etc/ssh/banner.txt && \
    echo "Find all the flags hidden on this machine." >> /etc/ssh/banner.txt

COPY setup.sh /setup.sh
RUN chmod +x /setup.sh

EXPOSE 22
CMD ["/setup.sh"]
