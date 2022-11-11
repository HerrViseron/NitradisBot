FROM node:lts-slim

LABEL org.opencontainers.image.authors="kontakt@viseron.de"

ENV NODE_ENV production
ENV UID=100
ENV GID=99

WORKDIR /usr/src/nitradisbot

COPY --chown=node:node . .

RUN groupmod -g ${UID} node && \
	usermod -u ${UID} -g ${GID} node && \
	rm Dockerfile && \
	npm install pm2 -g && \
	npm ci --omit=dev && \
	mkdir /var/lib/nitradisbot/ && \
	chown -R node:node /var/lib/nitradisbot/ 

USER node

VOLUME /var/lib/nitradisbot/

CMD ["pm2-runtime", "index.js"]
