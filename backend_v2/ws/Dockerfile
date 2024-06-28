FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 4004



CMD ["node", "index.js"]
