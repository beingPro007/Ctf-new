FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y gcc socat && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY vuln.c .
RUN gcc -o vuln vuln.c -fno-stack-protector -no-pie -z execstack -m64 -w

RUN echo "CTF{ret_addr_overwrite_success_0x41414141}" > /flag.txt && chmod 444 /flag.txt
RUN useradd -m ctf && chown root:root /app/vuln && chmod 4755 /app/vuln

USER ctf
EXPOSE 4001
CMD ["socat", "TCP-LISTEN:4001,reuseaddr,fork", "EXEC:/app/vuln"]
