sudo /usr/local/bin/cgcreate -a $USER:$USER -g memory,pids,cpu,net_cls:swadidik
sudo /usr/local/bin/cgcreate -a $USER:$USER -g memory,pids,cpu:swadidik
sudo chown $USER:root /sys/fs/cgroup/cgroup.procs

# nsjail -Q
# --seccomp_log 
# --config sandbox.cfg 
# --bindmount $PWD 
# --cwd "$PWD" 
# -- /usr/bin/python3 main.py

# nsjail --seccomp_log --config sandbox.cfg --bindmount $PWD --cwd "$PWD" -- /usr/bin/python3 main.py

# javac Main.java Helper.java
# jar -c -f test.jar -e Main Helper.class Main.class
# nsjail -Q --forward_signals --config sandbox.cfg -R $PWD --cwd "$PWD" -- /opt/jdk/bin/java -jar test.jar