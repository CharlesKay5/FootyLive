FROM ghcr.io/puppeteer/puppeteer:22.9.0

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app/public

COPY package*.json ./
RUN chown -R pptruser:pptruser /usr/src/app
USER pptruser

RUN npm install
COPY . .
RUN chown -R pptruser:pptruser /usr/src/app/public

CMD [ "node", "server.js" ]