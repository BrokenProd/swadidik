FROM ubuntu:26.04 AS base

RUN apt-get update && apt-get install -y \
    libc6 \
    libstdc++6 \
    libprotobuf32 \
    libnl-route-3-200 \
    && rm -rf /var/lib/apt/lists/*

# Stage: nsjail
FROM base AS nsjail

ARG NSJAIL_VERSION=3.6

RUN apt update && apt install -y \
    autoconf \
    bison \
    flex \
    gcc \
    g++ \
    git \
    libprotobuf-dev \
    libnl-route-3-dev \
    libtool \
    make \
    pkg-config \
    protobuf-compiler

RUN git clone https://github.com/google/nsjail.git \
    && cd nsjail \
    && git checkout tags/${NSJAIL_VERSION} \
    && make \
    && cp nsjail /bin \
    && cd / \
    && rm -rf /nsjail \
    && rm -rf /var/lib/apt/lists/*

# Stage: java
FROM base AS java

ARG JDK_MAJOR_VERSION=25

ENV JAVA_HOME=/opt/graalvm
ENV PATH="${JAVA_HOME}/bin:${PATH}"

RUN apt-get update \
    && apt-get install -y aria2 \
    && rm -rf /var/lib/apt/lists/*

RUN aria2c -x 16 -s 16 "https://download.oracle.com/graalvm/${JDK_MAJOR_VERSION}/archive/graalvm-jdk-${JDK_MAJOR_VERSION}_linux-x64_bin.tar.gz"
RUN set -eux \
    && tar -xzf "graalvm-jdk-${JDK_MAJOR_VERSION}_linux-x64_bin.tar.gz" -C /opt \
    && GRAALVM_DIR="$(find /opt -maxdepth 1 -type d -name "graalvm-jdk-${JDK_MAJOR_VERSION}*" -print -quit)" \
    && mv "$GRAALVM_DIR" "$JAVA_HOME" \
    && rm "graalvm-jdk-${JDK_MAJOR_VERSION}_linux-x64_bin.tar.gz"

FROM base AS go
ARG GO_VERSION=1.27.1
ARG GO_ARCH=amd64

RUN apt-get update \
    && apt-get install -y aria2 \
    && rm -rf /var/lib/apt/lists/*

RUN aria2c -x 16 -s 16 https://go.dev/dl/go${GO_VERSION}.linux-${GO_ARCH}.tar.gz
RUN tar -xf go${GO_VERSION}.linux-${GO_ARCH}.tar.gz -C /opt \
    && rm -r /opt/go/src

# Final stage: collections 
FROM base AS final

# copy nsjail binary
COPY --from=nsjail /bin/nsjail /bin

# Graalvm
ENV JAVA_HOME=/opt/graalvm
ENV PATH=$PATH:${JAVA_HOME}/bin
COPY --from=java /opt/graalvm /opt/graalvm

# Go
ENV PATH=$PATH:/opt/go/bin
COPY --from=go /opt/go /opt/go

# RUN apt-get install -y cgroup-tools && rm -rf /var/lib/apt/lists/*
RUN rm -rf /var/lib/apt/lists/*

WORKDIR /
# COPY docker-entrypoint.sh .
# ENTRYPOINT ["/bin/bash", "docker-entrypoint.sh"]