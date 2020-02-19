"use strict"

function CreateNewVersionHistory(assetId, assetType) {
	const versionHistory = html`<div class="btr-versionHistory"></div>`
	const versionList = html`<ul class="btr-versionList"></ul>`

	const pager = createPager()
	const pageSize = 40
	let isBusy = false

	async function loadPage(page) {
		if(isBusy) { return }
		isBusy = true

		const clampedPage = Math.max(1, page)
		const pageStart = (clampedPage - 1) * pageSize

		const innerPageOffset = pageStart % 10
		const innerPageStart = Math.floor(pageStart / 10) + 1
		const innerPageEnd = Math.floor((pageStart + pageSize - 1) / 10) + 1

		const innerPromises = []

		for(let i = innerPageStart; i <= innerPageEnd; i++) {
			const url = `https://www.roblox.com/places/version-history?assetID=${assetId}&page=${i}`

			innerPromises.push(fetch(url).then(async resp => {
				const text = await resp.text()
				const matches = text.match(/(<tr>[^]*?asset-version-id[^]*?<\/tr>)/gm)

				return matches ? matches.map(x => ({
					versionNumber: x.match(/td>(\d+)/)[1],
					created: x.match(/td>(\d*\/\d*\/\d*[^<]+)/)[1],
					assetVersionId: x.match(/asset-version-id="(\d+)/)[1],
					published: x.includes("icon-checkmark")
				})) : []
			}))
		}


		const results = (await Promise.all(innerPromises)).flat()
		const pageEnd = Math.min(results.length - innerPageOffset, pageSize)

		const maxVersion = +results[0].versionNumber + innerPageStart * 10
		const maxPage = Math.max(1, Math.floor((maxVersion - 1) / pageSize) + 1)

		pager.setMaxPage(maxPage)
		pager.setPage(Math.min(maxPage, clampedPage))

		versionList.$empty()

		for(let i = innerPageOffset; i < pageEnd; i++) {
			const item = results[i]

			const card = html`
			<li class="list-item">
				<div class="version-card" style="padding:2px 0">
					<div class="version-dropdown">
						<a class="rbx-menu-item" data-toggle="popover" data-container="body" data-bind="btr-versiondrop-${item.versionNumber}">
							<span class="icon-more"></span>
						</a>
						<div data-toggle="btr-versiondrop-${item.versionNumber}">
							<ul class="dropdown-menu btr-version-dropdown-menu">
								<li><a class="btr-version-revert" data-versionid="${item.assetVersionId}">Revert</a></li>
								<li><a class="btr-version-download" data-version="${item.versionNumber}">Download</a></li>
							</ul>
						</div>
					</div>
					<div class="version-thumb-container" style="display:none"><img class="version-thumb" style="display:none"></div>
					<div class="version-number">Version ${item.versionNumber}</div>
					<div class="version-date">${new Date(`${item.created} UTC`).$format("M/D/YY hh:mm A")} <span class=icon-checkmark-16x16 title="Published" style="float:right;margin-top:2px;${item.published ? "" : "display:none"}"></span></div>
				</div>
			</li>`

			versionList.append(card)
		}

		const script = document.createElement("script")
		script.innerHTML = "Roblox.BootstrapWidgets.SetupPopover()"
		versionList.append(script)

		isBusy = false
	}

	pager.onsetpage = loadPage
	loadPage(1)

	document.documentElement
		.$on("click", ".btr-version-revert", e => {
			if(isBusy) { return }

			const versionId = +e.currentTarget.dataset.versionid
			if(Number.isNaN(versionId)) { return }

			isBusy = true

			$.fetch("https://www.roblox.com/places/revert", {
				method: "POST",
				credentials: "include",
				body: new URLSearchParams({ assetVersionID: versionId }),
				xsrf: true
			}).then(response => {
				isBusy = false
				if(response.status === 200) { loadPage(1) }
			})
		})
		.$on("click", ".btr-version-download", e => {
			if(isBusy) { return }

			const version = +e.currentTarget.dataset.version
			if(Number.isNaN(version)) { return }

			isBusy = true

			const placeNameInput = $("#basicSettings>input")
			const placeName = (placeNameInput ? placeNameInput.value : "place").replace(/[^\w \-.]+/g, "").replace(/ {2,}/g, " ").trim()
			const fileExt = assetType === "place" ? "rbxl" : "rbxm"
			const fileName = `${placeName}-${version}.${fileExt}`

			const assetUrl = `https://assetdelivery.roblox.com/v1/asset/?id=${assetId}&version=${version}`
			AssetCache.loadBlob(assetUrl, blob => {
				isBusy = false
				const blobUrl = URL.createObjectURL(blob)
				startDownload(blobUrl, fileName)
				URL.revokeObjectURL(blobUrl)
			})
		})
	

	versionHistory.append(versionList)
	versionHistory.append(pager)

	return versionHistory
}


pageInit.placeconfig = function(placeId) {
	if(!settings.placeConfigure.versionHistory) { return }

	const newVersionHistory = CreateNewVersionHistory(placeId, "place")

	document.$watch("#versionHistory").$then()
		.$watch("#versionHistoryItems", cont => cont.replaceWith(newVersionHistory))
		.$watch(">.headline h2", header => {
			header.after(html`<a class="btn btn-secondary-sm btr-downloadAsZip" style="float:right;margin-top:4px;">Download all versions</a>`)
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
				const url = `https://assetdelivery.roblox.com/v1/asset/?id=${placeId}&version=${version}`
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