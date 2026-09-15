FROM ubuntu:26.04

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