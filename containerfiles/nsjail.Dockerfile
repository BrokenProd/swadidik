FROM ubuntu:26.04 AS base

ARG NSJAIL_VERSION=3.6

RUN apt-get -y update && apt-get install -y \
    libc6 \
    libstdc++6 \
    libprotobuf32 \
    libnl-route-3-200

RUN apt-get install -y \
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
    && rm -r /nsjail \
    rm -rf /var/lib/apt/lists/*