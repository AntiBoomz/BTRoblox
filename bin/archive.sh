cd ..
git archive --format=zip -9 -o bin/roblox.chrome.zip HEAD

cd bin
cp roblox.chrome.zip roblox.firefox.zip

7z d roblox.firefox.zip manifest.json
7z a roblox.firefox.zip ../manifest.firefox.json
7z rn roblox.firefox.zip manifest.firefox.json manifest.json