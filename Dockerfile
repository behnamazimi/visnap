FROM mcr.microsoft.com/playwright:v1.56.0-noble

WORKDIR /app

# Version will be passed from the GitHub release tag (e.g., "v1.2.3")
# Strip the 'v' prefix if present to get the npm version
ARG VERSION
ENV VIVIDIFF_VERSION=${VERSION#v}

# Install vividiff CLI and all adapters at the release version
RUN npm install -g \
  @vividiff/cli@${VIVIDIFF_VERSION} \
  @vividiff/playwright-adapter@${VIVIDIFF_VERSION} \
  @vividiff/storybook-adapter@${VIVIDIFF_VERSION} \
  @vividiff/url-adapter@${VIVIDIFF_VERSION}

ENTRYPOINT ["vividiff"]