# [INPUT]: Depends on the pinned Playwright runtime plus importer and service source trees.
# [OUTPUT]: Builds a non-root container for the asynchronous MiiiAo avatar service.
# [POS]: Deployment Adapter for Alibaba Cloud or any OCI-compatible host.
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
FROM mcr.microsoft.com/playwright:v1.63.0-noble

WORKDIR /app
COPY tools/maple_avatar/package.json tools/maple_avatar/package-lock.json tools/maple_avatar/
RUN cd tools/maple_avatar && npm ci --omit=dev

COPY tools/maple_avatar tools/maple_avatar
COPY services/avatar-builder services/avatar-builder

ENV NODE_ENV=production PORT=8788 AVATAR_OUTPUT_DIR=/data/builds
RUN mkdir -p /data/builds && chown -R pwuser:pwuser /data /app
USER pwuser
EXPOSE 8788
CMD ["node", "services/avatar-builder/server.mjs"]
