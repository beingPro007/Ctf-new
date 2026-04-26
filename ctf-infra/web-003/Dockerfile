FROM node:20-alpine
WORKDIR /app
RUN npm init -y && npm install express
COPY app.js .
RUN echo "CTF{cmd_inject_ping_rce_f0und}" > /flag.txt && chmod 444 /flag.txt
EXPOSE 5003
CMD ["node", "app.js"]
