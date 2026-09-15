#!/usr/bin/env bash
set -e

GRAALVM_NATIVE="/opt/graalvm/bin/native-image"

echo "==> Compiling source files..."
mkdir -p bin
javac -d bin *.java

echo "==> Building native image with restricted CPU & RAM..."
# -J-Xmx2g      -> Restricts compiler to 2GB RAM
# --parallelism=2 -> Restricts compiler to 2 CPU cores
$GRAALVM_NATIVE -J-Xmx256m --parallelism=1 -cp bin Main app

echo "==> Cleaning up class files..."
rm -rf bin

echo "==> Build complete!"