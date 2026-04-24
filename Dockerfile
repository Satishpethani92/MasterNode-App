# Build stage: pulls the full toolchain, installs dev deps, produces the bundle.
FROM node:20.18.0-alpine AS build

LABEL maintainer="admin@xinfin.network"
WORKDIR /app

# Non-root build user to keep the filesystem layout predictable.
RUN apk --no-cache add \
      bash \
      git \
      curl \
      python3 \
      build-base \
      libffi-dev \
      openssl-dev

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN mkdir -p build/contracts \
    && cp abis/*.json build/contracts/ \
    && npm run build

# Runtime stage: only production dependencies + built artifacts. This removes
# the build toolchain and dev-only packages from the final image, shrinking
# both attack surface and image size.
FROM node:20.18.0-alpine AS runtime

LABEL maintainer="admin@xinfin.network"
WORKDIR /app

# Create an unprivileged user to run the app.
RUN addgroup -S masternode && adduser -S masternode -G masternode

COPY --from=build /app/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps \
    && npm cache clean --force

COPY --from=build /app/build ./build
COPY --from=build /app/abis ./abis
COPY --from=build /app/apis ./apis
COPY --from=build /app/app ./app
COPY --from=build /app/commands ./commands
COPY --from=build /app/config ./config
COPY --from=build /app/contracts ./contracts
COPY --from=build /app/docs ./docs
COPY --from=build /app/helpers ./helpers
COPY --from=build /app/middlewares ./middlewares
COPY --from=build /app/models ./models
COPY --from=build /app/validators ./validators
COPY --from=build /app/abis.js ./abis.js
COPY --from=build /app/cmd.js ./cmd.js
COPY --from=build /app/crawl.js ./crawl.js
COPY --from=build /app/elect.js ./elect.js
COPY --from=build /app/helpers.js ./helpers.js
COPY --from=build /app/index.js ./index.js
COPY --from=build /app/index-prod.html ./index.html

RUN mkdir -p /app/tmp /app/sslcert \
    && chown -R masternode:masternode /app

USER masternode

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "index.js"]
