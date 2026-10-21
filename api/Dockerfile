FROM node:22-alpine

WORKDIR /app

# npm ci installs the exact versions from package-lock.json.
# --omit=dev skips test tools (jest, supertest...) to keep the image small.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# Shown by GET /api/version. Set them at build time, for example:
#   docker build --build-arg APP_VERSION=1.0.0 --build-arg GIT_SHA=$(git rev-parse --short HEAD) .
ARG APP_VERSION=dev
ARG GIT_SHA=local
ENV APP_VERSION=$APP_VERSION GIT_SHA=$GIT_SHA

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["npm", "start"]
