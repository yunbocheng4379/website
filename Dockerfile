# syntax=docker/dockerfile:1

FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_NOTE_APP_URL=""
ARG VITE_NOTE_APP_PORT="3015"
ENV VITE_NOTE_APP_URL=${VITE_NOTE_APP_URL}
ENV VITE_NOTE_APP_PORT=${VITE_NOTE_APP_PORT}

RUN npm run build

FROM nginx:1.28-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
