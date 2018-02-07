cd ..
git archive --format=zip -9 -o bin/roblox.chrome.zip HEAD

cd bin
cp roblox.chrome.zip roblox.firefox.zip

7z a roblox.chrome.zip ../manifest.chrome.json
7z rn roblox.chrome.zip manifest.chrome.json manifest.json

7z a roblox.firefox.zip ../manifest.firefox.json
7z rn roblox.firefox.zip manifest.firefox.json manifest.json