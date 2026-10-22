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

ARG JDK_VERSION="21.0.12.15"

RUN apt-get update \
    && apt-get install -y aria2 \
    && rm -rf /var/lib/apt/lists/*

RUN aria2c -x 16 -s 16 "https://github.com/ibmruntimes/semeru21-binaries/releases/download/jdk-${JDK_VERSION}/ibm-semeru-open-jdk_x64_linux_${JDK_VERSION}.tar.gz"
RUN tar -xzf "ibm-semeru-open-jdk_x64_linux_${JDK_VERSION}.tar.gz" -C /opt
RUN mv /opt/jdk-${JDK_VERSION} /opt/jdk

FROM base AS go
ARG GO_VERSION=1.27.1
ARG GO_ARCH=amd64

RUN apt-get update \
    && apt-get install -y aria2 \
    && rm -rf /var/lib/apt/lists/*

RUN aria2c -x 16 -s 16 https://go.dev/dl/go${GO_VERSION}.linux-${GO_ARCH}.tar.gz
RUN tar -xf go${GO_VERSION}.linux-${GO_ARCH}.tar.gz -C /opt 

# Final stage: collections 
FROM base AS final

# copy nsjail binary
COPY --from=nsjail /bin/nsjail /bin

# java
ENV JAVA_HOME=/opt/jdk
ENV PATH="${JAVA_HOME}/bin:${PATH}"
COPY --from=java /opt/jdk /opt/jdk

# Go
ENV PATH=$PATH:/opt/go/bin
COPY --from=go /opt/go /opt/go

ENV TZ=Asia/Jakarta
RUN apt-get update && apt-get install -y python3
RUN apt-get install -y cgroup-tools
RUN rm -rf /var/lib/apt/lists/*

WORKDIR /backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ .
RUN go build -o /app/main ./cmd/backend/main.go

WORKDIR /app
RUN rm -r /backend
COPY profiles/ profiles/
COPY docker-entrypoint.sh .
ENTRYPOINT ["/bin/bash","docker-entrypoint.sh"]