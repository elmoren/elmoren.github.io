---
title: Deploying Rails to AWS, Part 3
group: Billings Commuter Challenge
date: 2026-02-22
---
# {{ $frontmatter.title }}

This is Part 3 of the Deploying Rails to AWS series. Here are [Part 1](2025-09-13_Deploying%20Rails%20Part%201.md) and [Part 2](2025-09-19_Deploying%20Rails%20Part%202.md). Previously, I thought I would be working with CodeDeploy, but I think I'll first update the Commuter Challenge. It's years out of date.

It's been too long while since I worked on this, and I'm excited to be back. It was a busy end to 2025 with a trip to Europe, home upgrades and a busy holiday season on Etsy. Then I was learning [Gleam](https://gleam.run) and doing the [Advent of Code](https://adventofcode.com). The [repo is here](https://github.com/elmoren/AdventOfCode2025) if you're interested. I may write a post on Gleam eventually. It's a fun little language! 

## Updating The Commuter Challenge

The Commuter Challenge was 6 years out of date with minimal updates in that time. So I figured I should knock out some updates before continuing. This was tedious, to say the least. There was one major ruby version upgrade, 4 major version upgrades to Rails, and I also migrated from Turbolinks, UJS and Webpacker to Hotwire, and Vite. 

I won't bore you will all the details but will say that Rails has well documented guides for upgrading.

## ECS or EC2?

### Docker

With that out the way, let's try Docker. I'm considering deploying the Commuter Challenge on ECS rather than an EC2 instance. I think this will be easier to deploy and manage the Commuter Challenge over time. And hopefully, it won't add much cost.

The first step was to get Docker running locally and running a container. There's a handy gem [dockerfile-rails](https://github.com/fly-apps/dockerfile-rails), that can help you kickstart it by generating a Dockerfile for you. This helped me get started, and then I had to make a few changes to get it working with the Commuter Challenge.

I also updated the config so rails could connect to the Postgres database running on the local machine in development mode whether it's running in a container or locally. 

```yaml
## database.yml, in the development section

# Use the APP_DB_HOST env or localhost to connect as the postgres host.
# The Dockerfile.dev will set APP_DB_HOST=host.docker.internal
host: <%= ENV.fetch('APP_DB_HOST', 'localhost') %>
```

This is `Dockerfile.dev`:

```Dockerfile
# syntax=docker/dockerfile:1
# check=error=true

# Make sure RUBY_VERSION matches the Ruby version in .ruby-version
ARG RUBY_VERSION=3.4.6
FROM ruby:$RUBY_VERSION-slim AS base

WORKDIR /rails

# Update gems and bundler
RUN gem update --system --no-document && \
    gem install -N bundler

# Install base packages
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y curl libjemalloc2 libvips postgresql-client && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Development
ENV GEM_HOME=/usr/local/bundle
ENV GEM_PATH=/usr/local/bundle
ENV BUNDLE_PATH=/usr/local/bundle
ENV BUNDLE_BIN=/usr/local/bundle/bin
ENV PATH="${BUNDLE_BIN}:${PATH}"
ENV RAILS_ENV=development
ENV NODE_ENV=development
ENV APP_DB_HOST=host.docker.internal

# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build gems and node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential libffi-dev libpq-dev libyaml-dev node-gyp pkg-config python-is-python3 && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Install JavaScript dependencies
ARG NODE_VERSION=20.19.3
ARG YARN_VERSION=1.22.22
ENV PATH=/usr/local/node/bin:$PATH
RUN curl -sL https://github.com/nodenv/node-build/archive/master.tar.gz | tar xz -C /tmp/ && \
    /tmp/node-build-master/bin/node-build "${NODE_VERSION}" /usr/local/node && \
    npm install -g yarn@$YARN_VERSION && \
    rm -rf /tmp/node-build-master

# Install application gems
COPY Gemfile Gemfile.lock ./
RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git && \
    bundle exec bootsnap precompile --gemfile

# Install node modules
COPY .yarnrc package.json yarn.lock ./
COPY .yarn/releases/* .yarn/releases/
RUN yarn install --frozen-lockfile

# Copy application code
COPY . .

RUN bin/vite build

# Precompile bootsnap code for faster boot times
RUN bundle exec bootsnap precompile app/ lib/

# Precompiling assets for production without requiring secret RAILS_MASTER_KEY
RUN SECRET_KEY_BASE_DUMMY=1 ./bin/rails assets:precompile


# Final stage for app image
FROM base

# Install packages needed for deployment
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y imagemagick libvips && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Copy built artifacts: gems, application
COPY --from=build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --from=build /rails /rails

# Run and own only the runtime files as a non-root user for security
RUN groupadd --system --gid 1000 rails && \
    useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash && \
    chown -R 1000:1000 db log storage tmp
USER 1000:1000

# Entrypoint prepares the database.
ENTRYPOINT ["/rails/bin/docker-entrypoint"]

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]
```

Then to build and run it:
```shell
docker build . -f Dockerfile.dev 
docker run --rm -p 3000:3000 <image>
```

Next, I wrote a simple `docker-compose.yml` for local development.

```yaml
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: rails_app
    networks:
      - app_network
    ports:
      - "3000:3000"

networks:
  app_network:
    driver: bridge

```

And to run it:

```shell
docker compose build
docker compose up
```
## Rake Tasks

I also created some Rake tasks. These aren't saving time yet, but should be more useful when I start automating the production build and deployment tasks.

```ruby
  task build: :environment do
    puts "🚧 Building..."
    system("docker compose build")
    puts "✅ Complete"
  end

  task up: :environment do
    puts "🚀 Starting development server... http://localhost:3000"
    system("docker compose up")
  end

  task down: :environment do
    puts "🛑 Stopping development server..."
    system("docker compose down")
  end
```

## Conclusions and Next Steps

With that, the Commuter Challenge received some much-needed software upgrades and the development build is now containerized. Running the Commuter Challenge in a container is appealing for many reasons, so next I'll try and get it deployed on ECS.

The general plan is to:

1. Adjust CFN templates for an ECS deployment
2. Create a Dockerfile for the production build
3. Use the secrets manager the store the database credentials
4. Adjust all the production config to fit the AWS deployment

Then we should have a Commuter Challenge instance running in AWS!