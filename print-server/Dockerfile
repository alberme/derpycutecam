
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    nodejs \
    npm \
    cups \
    cups-client \
    cups-filters \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server.js entrypoint.sh ./
COPY src/ ./src/
RUN chmod +x /app/entrypoint.sh \
    && mkdir -p /app/uploads

EXPOSE 3000

CMD ["/app/entrypoint.sh"]
