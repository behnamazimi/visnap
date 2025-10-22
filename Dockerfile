FROM mcr.microsoft.com/playwright:v1.56.1-noble

WORKDIR /app

# Version will be passed from the GitHub release tag (e.g., "v1.2.3")
# Strip the 'v' prefix if present to get the npm version
ARG VERSION
ENV VISNAP_VERSION=${VERSION#v}

# Install visnap CLI and all adapters at the release version
RUN npm install -g \
  visnap@${VISNAP_VERSION} \
  @visnap/playwright-adapter@${VISNAP_VERSION} \
  @visnap/storybook-adapter@${VISNAP_VERSION} \
  @visnap/url-adapter@${VISNAP_VERSION}

ENTRYPOINT ["visnap"]