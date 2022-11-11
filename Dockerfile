FROM node:lts-slim

LABEL org.opencontainers.image.authors="kontakt@viseron.de"

ENV NODE_ENV production

WORKDIR /usr/src/nitradisbot

COPY --chown=node:node . .

RUN rm Dockerfile && \
	npm install pm2 -g && \
	npm ci --omit=dev && \
	mkdir /var/lib/nitradisbot/ && \
	chown -R node:node /var/lib/nitradisbot/ && \
	chmod +x entrypoint.sh

USER node

VOLUME /var/lib/nitradisbot/

ENTRYPOINT [ "./entrypoint.sh" ]

CMD ["pm2-runtime", "index.js"]
