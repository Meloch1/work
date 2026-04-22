FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY *.js *.mjs ./
COPY public/ ./public/
EXPOSE 3000
CMD ["node", "startup.mjs"]
