FROM node:20-alpine

WORKDIR /app

COPY frontend/package*.json /app/
RUN npm ci

COPY frontend /app

ENV PORT=3000 \
    HOST=0.0.0.0

EXPOSE 3000

CMD ["npm", "start"]


