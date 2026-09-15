FROM node:lts AS builder
LABEL org.opencontainers.image.authors="kontakt@viseron.de"

WORKDIR /usr/src/nitradisbot

COPY package.json package-lock.json ./
RUN npm ci --omit=dev


FROM node:lts-slim

RUN apt-get update && \
	apt-get install -y --no-install-recommends procps && \
	rm -rf /var/lib/apt/lists/*

ENV NODE_ENV production

WORKDIR /usr/src/nitradisbot

COPY --from=builder /usr/src/nitradisbot/node_modules ./node_modules
COPY --chown=node:node . .

RUN rm ./Dockerfile && \
	mkdir -p /var/lib/nitradisbot && \
	chown -R node:node /var/lib/nitradisbot

USER node

VOLUME /var/lib/nitradisbot

CMD ["node", "nitradisbot.js"]
