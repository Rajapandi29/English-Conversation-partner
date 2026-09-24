FROM node:22-alpine

WORKDIR /app


COPY package.json package-lock.json ./

Run npm install


COPY . .

RUN npm run build


EXPOSE 3000

CMD ["node", "server.js"]