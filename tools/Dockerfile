FROM node:10

WORKDIR /usr/src/app

ENV PUBLIC_KEY_FILE /keys/public.pem
ENV PRIVATE_KEY_FILE /keys/private.pem

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8080
CMD [ "node", "server.js" ]
