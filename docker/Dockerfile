FROM node:lts-slim

LABEL org.opencontainers.image.authors="kontakt@viseron.de"

ENV NODE_ENV production

WORKDIR /usr/src/nitradisbot

COPY --chown=node:node . .

RUN rm -r ./docker && \
	npm install pm2 -g && \
	npm ci --only=production

USER node

CMD ["pm2-runtime", "index.js"]
