FROM node:lts-slim

LABEL org.opencontainers.image.authors="kontakt@viseron.de"

ENV NODE_ENV production

WORKDIR /usr/src/nitradisbot

COPY --chown=node:node . .

RUN rm Dockerfile && \
	npm install pm2 -g && \
	npm ci --omit=dev && \
	mkdir /var/lib/nitradisbot/ && \
	chown -R node:node /var/lib/nitradisbot/ 

USER node

VOLUME /var/lib/nitradisbot/

CMD ["pm2-runtime", "index.js"]
