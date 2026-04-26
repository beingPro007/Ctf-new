FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y gcc socat binutils && rm -rf /var/lib/apt/lists/*

WORKDIR /challenge
COPY crackme.c .
RUN gcc -o crackme crackme.c -O0 -s && strip --strip-all crackme
RUN chmod 755 crackme

EXPOSE 4003
CMD ["socat", "TCP-LISTEN:4003,reuseaddr,fork", "EXEC:/challenge/crackme"]
