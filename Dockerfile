FROM keymetrics/pm2:latest-alpine

WORKDIR /usr/src/app

COPY . .
RUN npm install pm2 -g
RUN npm install
RUN npm run build

EXPOSE 3000

CMD ["pm2-runtime", "process.yml" ]
