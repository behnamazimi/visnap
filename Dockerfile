FROM mcr.microsoft.com/playwright:v1.56.1-noble

# Install visnap CLI and all adapters globally (latest stable versions)
RUN npm install -g visnap \
    @visnap/playwright-adapter \
    @visnap/storybook-adapter \
    @visnap/url-adapter


WORKDIR /app

ENTRYPOINT ["visnap"]