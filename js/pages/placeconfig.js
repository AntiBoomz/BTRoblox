"use strict"

function CreateNewVersionHistory(assetId, assetType) {
	const versionHistory = html`<div class="btr-versionHistory"></div>`
	const versionList = html`<ul class="btr-versionList"></ul>`
	const pager = createPager()
	const pageSize = 40

	let isBusy = false
	let actualPageSize

	async function getPage(page, target) {
		const url = `https://api.roblox.com/assets/${assetId}/versions?page=${page}`
		const response = await $.fetch(url, { credentials: "include" })
		const json = await response.json()

		if(Array.isArray(target)) {
			const offset = (page - 1) * actualPageSize

			json.forEach((v, i) => {
				target[offset + i] = v
			})
		} else {
			target(json)
		}
	}

	function constructPage(items, itemStart, itemEnd) {
		versionList.$empty()

		for(let i = itemStart; i <= itemEnd; i++) {
			const item = items[i]
			if(!item) { break }

			const card = html`
			<li class="list-item">
				<div class="version-card" style="padding:2px 0">
					<div class="version-dropdown">
						<a class="rbx-menu-item" data-toggle="popover" data-container="body" data-bind="btr-versiondrop-${i}">
							<span class="icon-more"></span>
						</a>
						<div data-toggle="btr-versiondrop-${i}">
							<ul class="dropdown-menu btr-version-dropdown-menu">
								<li><a class="btr-version-revert" data-versionId="${item.Id}">Revert</a></li>
								<li><a class="btr-version-download" data-version="${item.VersionNumber}">Download</a></li>
							</ul>
						</div>
					</div>
					<div class="version-thumb-container" style="display:none"><img class="version-thumb" style="display:none"></div>
					<div class="version-number">Version ${item.VersionNumber}</div>
					<div class="version-date">${new Date(item.Created).$format("M/D/YY hh:mm A (T)")}</div>
				</div>
			</li>`

			/* New roblox thumbnails ruined this ;-;
			img.attr("src", "").hide()
			function tryGetThumbnail() {
				if(thumbnailCache[data.Id])
					return img.attr("src", thumbnailCache[data.Id]);

				$.get("/Thumbs/RawAsset.ashx?assetVersionId={0}&imageFormat=png&width=110&height=110".format(data.Id), (data) => {
					if(data === "PENDING")
						return setTimeout(tryGetThumbnail, 1000);

					thumbnailCache[data.Id] = data
					img.attr("src", data).show()
				})
			}

			tryGetThumbnail() */
			versionList.append(card)
		}

		const script = document.createElement("script")
		script.innerHTML = "Roblox.BootstrapWidgets.SetupPopover()"
		versionList.append(script)
	}


	function loadPage(page) {
		if(isBusy) { return }
		isBusy = true

		const promises = []
		const items = []
		const itemStart = (page - 1) * pageSize
		const itemEnd = itemStart + pageSize - 1

		const pageFrom = Math.floor(itemStart / actualPageSize) + 1
		const pageTo = Math.floor(itemEnd / actualPageSize) + 1

		for(let i = pageFrom; i <= pageTo; i++) {
			promises.push(getPage(i, items))
		}

		SyncPromise.all(promises).then(() => {
			constructPage(items, itemStart, itemEnd)
			isBusy = false
			pager.setPage(page)
		})
	}

	document.documentElement
		.$on("click", ".btr-version-revert", e => {
			if(isBusy) { return }

			const versionId = parseInt(e.currentTarget.getAttribute("data-versionId"), 10)
			if(Number.isNaN(versionId)) { return }

			isBusy = true

			xsrfFetch("https://www.roblox.com/places/revert", {
				method: "POST",
				credentials: "include",
				body: new URLSearchParams({ assetVersionID: versionId })
			}).then(response => {
				isBusy = false
				if(response.status === 200) { loadPage(1) }
			})
		})
		.$on("click", ".btr-version-download", e => {
			if(isBusy) { return }

			const version = parseInt(e.currentTarget.getAttribute("data-version"), 10)
			if(Number.isNaN(version)) { return }

			isBusy = true

			const placeNameInput = $("#basicSettings>input")
			const placeName = (placeNameInput ? placeNameInput.value : "place").replace(/[^\w \-.]+/g, "").replace(/ {2,}/g, " ").trim()
			const fileExt = assetType === "place" ? "rbxl" : "rbxm"
			const fileName = `${placeName}-${version}.${fileExt}`

			const assetUrl = `https://assetgame.roblox.com/asset/?id=${assetId}&version=${version}`
			AssetCache.loadBlob(assetUrl, blob => {
				isBusy = false
				const blobUrl = URL.createObjectURL(blob)
				startDownload(blobUrl, fileName)
				URL.revokeObjectURL(blobUrl)
			})
		})

	pager.onsetpage = loadPage


	isBusy = true
	getPage(1, json => {
		actualPageSize = json.length
		pager.setMaxPage(Math.floor((json[0].VersionNumber - 1) / pageSize) + 1)
		pager.setPage(1)
		constructPage(json, 0, pageSize - 1)
		isBusy = false
	})

	versionHistory.append(versionList)
	versionHistory.append(pager)

	return versionHistory
}


pageInit.placeconfig = function(placeId) {
	if(!settings.versionhistory.enabled) { return }

	const newVersionHistory = CreateNewVersionHistory(placeId, "place")

	document.$watch("#versionHistory").$then()
		.$watch("#versionHistoryItems", cont => cont.replaceWith(newVersionHistory))
		.$watch(">.headline h2", header => {
			header.after(html`<a class="btn btn-secondary-sm btr-downloadAsZip" style="float:right;margin-top:4px;">Download as .zip</a>`)
		})

	document.$on("click", ".btr-downloadAsZip:not(.disabled)", e => {
		const btn = e.currentTarget
		const origText = btn.textContent

		const placeNameInput = $("#basicSettings>input")
		const fileName = (placeNameInput ? placeNameInput.value : "place").replace(/[^\w \-.]+/g, "").replace(/ {2,}/g, " ").trim()

		btn.classList.add("disabled")
		btn.textContent = "Loading versions..."

		const files = []
		const centralDirectory = []
		let numFiles = 0
		let fileOffset = 0
		let centralLength = 0

		let totalVersions
		let nextVersion = 1
		let loadersAlive = 5

		const crcTable = []
		for(let i = 0; i < 256; i++) {
			let n = i
			for(let j = 0; j < 8; j++) { n = n & 1 ? (n >>> 1) ^ 0xEDB88320 : (n >>> 1) }

			crcTable[i] = n
		}

		const crc32 = buffer => {
			let crc = -1
			
			for(let i = 0, l = buffer.byteLength; i < l; i++) {
				crc = (crc >>> 8) ^ crcTable[(crc ^ buffer[i]) & 0xFF]
			}

			return ~crc
		}

		const loadFile = () => {
			if(nextVersion > totalVersions) {
				if(--loadersAlive === 0) {
					btn.textContent = "Generating file..."

					const eoc = new Uint8Array(22)
					const eview = new DataView(eoc.buffer)
					eview.setUint32(0, 0x06054b50, true)
					eview.setUint16(8, numFiles, true)
					eview.setUint16(10, numFiles, true)
					eview.setUint32(12, centralLength, true)
					eview.setUint32(16, fileOffset, true)

					const blob = new Blob([...files, ...centralDirectory, eoc])
					const blobUrl = URL.createObjectURL(blob)

					btn.classList.remove("disabled")
					btn.textContent = origText

					startDownload(blobUrl, `${fileName}.zip`)
					URL.revokeObjectURL(blobUrl)
				}
				return
			}

			const version = nextVersion++
			let retryTime = 1000

			const tryDownload = () => {
				const url = `https://assetgame.roblox.com/asset/?id=${placeId}&version=${version}`
				AssetCache.loadBuffer(url, file => {
					try {
						const nameStr = `${fileName}-${version}.rbxl`
						const name = new TextEncoder().encode(nameStr)

						const date = new Date()
						const modTime = (((date.getHours() << 6) | date.getMinutes()) << 5) | date.getSeconds() / 2
						const modDate = ((((date.getFullYear() - 1980) << 4) | (date.getMonth() + 1)) << 5) | date.getDate()

						const cfile = file
						const crc = crc32(new Uint8Array(file))

						const header = new Uint8Array(30 + name.byteLength)
						const hview = new DataView(header.buffer)
						hview.setUint32(0, 0x04034b50, true)
						hview.setUint32(4, 0x08080014, true)
						hview.setUint16(10, modTime, true)
						hview.setUint16(12, modDate, true)
						hview.setUint32(14, crc, true)
						hview.setUint32(18, cfile.byteLength, true)
						hview.setUint32(22, file.byteLength, true)
						hview.setUint16(26, name.byteLength, true)
						header.set(name, 30)

						const footer = new Uint8Array(16)
						const fview = new DataView(footer.buffer)
						fview.setUint32(0, 0x08074b50, true)
						fview.setUint32(4, crc, true)
						fview.setUint32(8, cfile.byteLength, true)
						fview.setUint32(12, file.byteLength, true)

						const central = new Uint8Array(46 + name.byteLength)
						const cview = new DataView(central.buffer)
						cview.setUint32(0, 0x02014b50, true)
						cview.setUint16(4, 0x0014, true)
						central.set(header.subarray(4, 30), 6)
						cview.setUint32(42, fileOffset, true)
						central.set(name, 46)

						files.push(header.buffer, cfile, footer.buffer)
						centralDirectory.push(central.buffer)
						fileOffset += header.byteLength + cfile.byteLength + footer.byteLength
						centralLength += central.byteLength

						numFiles++
						btn.textContent = `Downloading ${numFiles}/${totalVersions}`

						setTimeout(loadFile, 100)
					} catch(ex) {
						console.error(ex)
						setTimeout(tryDownload, retryTime)
						retryTime *= 1.5
					}
				})
			}
			tryDownload()
		}

		const url = `https://api.roblox.com/assets/${placeId}/versions`
		$.fetch(url, { credentials: "include" }).then(async resp => {
			let json
			try { json = await resp.json() }
			catch(ex) { console.warn(ex) }

			if(!json || !json.length) {
				btn.textContent = "Failed..."

				setTimeout(() => {
					btn.classList.remove("disabled")
					btn.textContent = origText
				}, 2000)
				
				return
			}
			
			totalVersions = json[0].VersionNumber
	
			for(let i = 0, l = loadersAlive; i < l; i++) {
				loadFile()
			}
		})
	})
}