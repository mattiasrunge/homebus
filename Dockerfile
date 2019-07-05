FROM node:12-stretch-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY src/package.json ./
RUN yarn

# Copy app source
COPY src ./

EXPOSE 23230
CMD [ "node", "broker/index.js", "-c", "/etc/homebus.json" ]
