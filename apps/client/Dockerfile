FROM node:22-bullseye AS dependencies-env
RUN npm i -g pnpm
COPY ./apps/client /app/apps/client

FROM dependencies-env AS development-dependencies-env
COPY ./package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc /app/
COPY ./apps/client/package.json \
    ./apps/client/react-router.config.ts \
    ./apps/client/tsconfig.json \
    ./apps/client/vite.config.ts \
    /app/apps/client/
WORKDIR /app
RUN pnpm i --frozen-lockfile

FROM dependencies-env AS production-dependencies-env
COPY ./package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc /app/
COPY ./apps/client/package.json /app/apps/client/package.json
WORKDIR /app
RUN pnpm i --prod --frozen-lockfile

FROM dependencies-env AS build-env
COPY ./package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc /app/
COPY ./apps/client/package.json /app/apps/client/package.json
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
COPY --from=development-dependencies-env /app/apps/client/node_modules /app/apps/client/node_modules
WORKDIR /app
RUN pnpm -F client run build

# FROM nginx:alpine
# COPY --from=build-env /app/apps/client/build/client            /usr/share/nginx/html

# # Configure nginx to handle SPA routing
# RUN echo 'server { \
#     listen 3000; \
#     location / { \
#         root /usr/share/nginx/html; \
#         index index.html; \
#         try_files $uri $uri/ /index.html; \
#     } \
# }' > /etc/nginx/conf.d/default.conf

# EXPOSE 3000
# CMD ["nginx", "-g", "daemon off;"]

FROM dependencies-env
COPY ./package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc /app/
COPY ./apps/client/package.json /app/apps/client/package.json
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=production-dependencies-env /app/apps/client/node_modules /app/apps/client/node_modules
COPY --from=build-env /app/apps/client/build /app/apps/client/build
WORKDIR /app
CMD ["pnpm", "-F", "client", "start"]

EXPOSE 3000
