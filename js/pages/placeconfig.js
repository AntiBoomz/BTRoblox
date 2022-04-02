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


		const results = (await SyncPromise.all(innerPromises)).flat()
		const pageEnd = Math.min(results.length - innerPageOffset, pageSize)

		const maxVersion = +results[0].versionNumber + (innerPageStart - 1) * 10
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
								<li><a class="rbx-menu-item btr-version-revert" data-versionid="${item.assetVersionId}">Revert</a></li>
								<li><a class="rbx-menu-item btr-version-download" data-version="${item.versionNumber}">Download</a></li>
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
		
		InjectJS.send("setupPopover")
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
			AssetCache.loadBuffer(assetUrl, buffer => {
				isBusy = false
				const blobUrl = URL.createObjectURL(new Blob([buffer], { type: "application/octet-stream" }))
				startDownload(blobUrl, fileName)
				URL.revokeObjectURL(blobUrl)
			})
		})
	

	versionHistory.append(versionList)
	versionHistory.append(pager)

	return versionHistory
}


pageInit.placeconfig = function(placeId) {
	if(!SETTINGS.get("placeConfigure.versionHistory")) { return }

	const newVersionHistory = CreateNewVersionHistory(placeId, "place")
	document.$watch("#versionHistoryItems", cont => cont.replaceWith(newVersionHistory))
}