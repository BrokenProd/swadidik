FROM swadidik:nsjail AS nsjail
FROM swadidik:graalvm AS java

FROM ubuntu:26.04

RUN apt-get update && apt-get install -y \
    libc6 \
    libstdc++6 \
    libprotobuf32 \
    libnl-route-3-200

# copy nsjail binary
COPY --from=nsjail /bin/nsjail /bin

# Graalvm
ENV JAVA_HOME=/opt/graalvm
ENV PATH=$PATH:${JAVA_HOME}/bin
COPY --from=java /opt/graalvm /opt/graalvm

RUN rm -rf /var/lib/apt/lists/*
