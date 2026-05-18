# Stage development
FROM node:23-alpine AS dev

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "run", "start:dev", "--", "--legacy-watch"]


# Stage production
FROM node:23-alpine AS prod

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

RUN npm run build

CMD ["npm", "run", "start:prod", "--", "--legacy-watch"]
