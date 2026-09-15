from copy import deepcopy
from os import system

build_map = {
    "nsjail": "nsjail.Dockerfile",
    "graalvm":  "graalvm.Dockerfile",
    "collections": "collections.Dockerfile",
}

def build(target: str):
    cmd = [
        "docker",
        "build", "..",
        "-f", "containerfiles/"+build_map[target],
        "-t", "swadidik:"+target
    ]
    system(" ".join(cmd))

def build_all():
    bm = deepcopy(build_map)
    del bm["collections"]
    for it in bm.keys():
        build(it)
    build("collections")


if __name__ == "__main__":
    build("nsjail")
    # build_all()
    # build("collections")