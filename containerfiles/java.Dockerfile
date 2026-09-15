# IBM Semeru source below
# https://github.com/ibmruntimes/semeru-containers/blob/ibm/8/jdk/ubuntu/resolute/Dockerfile.open.releases.full
FROM ubuntu:26.04

ARG JDK8_VERSION=8.0.504.0
RUN apt-get update && apt-get install -y aria2

RUN aria2c -s 16 -x 16 -o openjdk.tar.gz -d /tmp https://github.com/ibmruntimes/semeru8-binaries/releases/download/jdk-${JDK8_VERSION}/ibm-semeru-open-jdk_x64_linux_${JDK8_VERSION}.tar.gz 
RUN tar -xf /tmp/openjdk.tar.gz -C /opt/ \
    && rm -f /tmp/openjdk.tar.gz \
    && mv /opt/jdk-${JDK8_VERSION} /opt/openjdk
RUN cd /opt/openjdk \
    && rm -r man sample src.zip \
    && rm -rf /var/lib/apt/lists/* 