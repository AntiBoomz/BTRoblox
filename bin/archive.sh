cd ..
git archive --format=zip -9 -o bin/btroblox.chrome.zip HEAD

cd bin
cp btroblox.chrome.zip btroblox.firefox.zip

7z d btroblox.firefox.zip manifest.json
7z a btroblox.firefox.zip ../manifest.firefox.json
7z rn btroblox.firefox.zip manifest.firefox.json manifest.json