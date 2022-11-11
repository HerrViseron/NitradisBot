FROM node:lts-slim

LABEL org.opencontainers.image.authors="kontakt@viseron.de"

ENV NODE_ENV production

WORKDIR /usr/src/nitradisbot

RUN git clone https://github.com/HerrViseron/NitradisBot.git . && \
	rm -r ./docker && \
	chown -R node:node /usr/src/nitradisbot && \
	npm install pm2 -g && \
	npm ci --only=production

USER node

CMD ["pm2-runtime", "index.js"]
