# UrineAnalyzer RaspberryPi Side

# bash.sh
```
#!/bin/sh -e
cat << "EOF"

 _   _     _              _             _                  __   ___   __
| | | |_ _(_)_ _  ___    /_\  _ _  __ _| |_  _ ______ _ _  \ \ / / | /  \
| |_| | '_| | ' \/ -_)  / _ \| ' \/ _` | | || |_ / -_) '_|  \ V /| || () |
 \___/|_| |_|_||_\___| /_/ \_\_||_\__,_|_|\_, /__\___|_|     \_/ |_(_)__/
   We are currently booting up            |__/
EOF
echo $cat
export HOME="/root"
cd /root/piruzao/
/root/piruzao/auto-bundle.sh > /dev/console 2>&1 | tee /root/piruzao/auto-bundle.txt
/root/piruzao/run.sh > /dev/console 2>&1 | tee /root/log.txt &
#xinput_calibrator --output-type xorg.conf.d --output-filename /usr/share/X11/xorg.conf.d/01-input.conf
while !(netstat -lnt | awk '$6 == "LISTEN" && $4 ~ ".80"' | grep -q "80"); do
sleep 1
done
sleep 5
xinit /usr/local/lib/node_modules/electron-prebuilt/dist/electron /root/piruzao/bundle/index.js 2>/dev/null
```
# run.sh
```
export MONGO_URL=mongodb://localhost:27017/test
export ROOT_URL=http://localhost
export PORT=80
node /root/piruzao/bundle/main.js
```
# auto-bundle.sh
```
bundle="app.tar.gz"

if [ -f "$bundle" ]; then
  echo '>>> New bundle detected'

  if [ -d "bundle" ]; then
     echo '>>> Cleaning up bundle directory'
     rm bundle/ -rf
  fi

  echo '>>> Extracting '$bundle
  tar -xf $bundle
  echo '>>> Cleaning up '$bundle
  rm -rf $bundle
  echo '>>> Installing node dependencies'
  (cd bundle/programs/server && npm install)
  (cd bundle/programs/server && rm -R npm/npm-bcrypt/node_modules/bcrypt)
  (cd bundle/programs/server && npm install serialport underscore fs mongodb-backup mongodb-restore bcrypt)
  cp index.js bundle/index.js
fi
```
# index.js
```
var app = require('app')
var BrowserWindow = require('browser-window')
app.on('ready',function(){
  var mainWindow = new BrowserWindow({
    width:848,
    heigth:477,
    frame:false,
    zoomFactor:0.8
  })
mainWindow.loadUrl('http://localhost:80/');
mainWindow.setFullScreen(true);
})
```
# rc.local
```
#!/bin/sh -e
#
# rc.local
#
# This script is executed at the end of each multiuser runlevel.
# Make sure that the script will "exit 0" on success or any other
# value on error.
#
# In order to enable or disable this script just change the execution
# bits.
#
# By default this script does nothing.

/bin/sh /root/bash.sh >/dev/console 2>&1 &
exit 0
```
