# Set up the build environment
FROM node:20-alpine as build
WORKDIR /app
COPY ./package*.json ./

# Build the app
FROM build AS app
RUN npm ci --ignore-scripts
COPY . .
ARG BASE_PATH=""
ENV PUBLIC_DICOMWEB_URLS=""
RUN npm run build

# Install & build the production dependencies
FROM build AS dependencies
RUN npm ci --ignore-scripts --omit=dev

# Set up the final image
FROM node:20-alpine
WORKDIR /app
ENV ORIGIN=http://localhost:3000 HOST=0.0.0.0 PORT=3000
COPY ./package*.json ./
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=app /app/build ./build

EXPOSE 3000

ENTRYPOINT ["node", "build"]