# See here for image contents: https://github.com/microsoft/vscode-dev-containers/tree/v0.154.0/containers/ruby/.devcontainer/base.Dockerfile

# [Choice] Ruby version: 2, 2.7, 2.6, 2.5
ARG VARIANT="2"
FROM mcr.microsoft.com/vscode/devcontainers/ruby:0-${VARIANT}

# [Option] Install Node.js
ARG INSTALL_NODE="true"
ARG NODE_VERSION="lts/*"
RUN if [ "${INSTALL_NODE}" = "true" ]; then su vscode -c "source /usr/local/share/nvm/nvm.sh && nvm install ${NODE_VERSION} 2>&1"; fi

RUN npm install -g aws-cdk
