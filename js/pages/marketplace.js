"use strict"

pageInit.marketplace = () => {
	const addRipple = btnCont => {
		btnCont?.$find(">a").$on("mousedown", () => {
			const ripple = html`<div class=btr-replica-ripple></div>`
			btnCont.$find(">a").append(ripple)
			setTimeout(() => ripple.remove(), 1e3)
		})
	}
	
	class AssetDetailsPage {
		constructor(assetId) {
			this.assetId = assetId
			this.buttons = {}
			
			RobloxApi.economy.getAssetDetails(assetId).then(json => {
				if(this.assetId !== assetId) { return }
				this.assetTypeId = json.AssetTypeId
				
				this.updateButtons()
			})
			
			this.observer = new MutationObserver(() => {
				this.updateAnchor()
			})
			
			this.observer.observe(document.body, { childList: true, subtree: true })
			this.updateAnchor()
		}
		
		addButton(name, elem) {
			if(!elem) { return }
			
			this.buttons[name] = elem
			addRipple(elem)
			
			this.updateButtons()
		}
		
		updateButtons() {
			if(!this.assetTypeId) { return }
			
			if(!this.contentPromise) {
				this.contentPromise = initContentButton(this.assetId, this.assetTypeId)
				this.contentPromise.then(elem => this.addButton("content", elem))
			}
			
			if(!this.downloadPromise) {
				this.downloadPromise = initDownloadButton(this.assetId, this.assetTypeId)
				this.downloadPromise.then(elem => this.addButton("download", elem))
			}
			
			if(!this.explorerPromise) {
				this.explorerPromise = initExplorer(this.assetId, this.assetTypeId)
				this.explorerPromise.then(elem => this.addButton("explorer", elem))
			}
			
			this.anchor?.prepend(...[
				this.buttons.content,
				this.buttons.download,
				this.buttons.explorer
			].filter(x => x))
		}
		
		updateAnchor() {
			const anchor = document.querySelector(`button[data-testid="getAsset"]`)?.parentNode || null
			if(anchor === this.anchor) { return }
			
			this.anchor = anchor
			this.updateButtons()
		}
		
		close() {
			this.observer?.disconnect()
			
			this.assetId = null
			this.assetTypeId = null
			
			this.observer = null
			this.anchor = null
			
			this.explorerPromise?.then(btn => btn?.remove())
			this.downloadPromise?.then(btn => btn?.remove())
			this.contentPromise?.then(btn => btn?.remove())
			
			this.explorerPromise = null
			this.downloadPromise = null
			this.contentPromise = null
		}
	}
	
	//
	
	let currPageParams
	let currPageObj
	let currPage
	
	const stateChanged = () => {
		let nextPageParams
		let nextPage
		
		const assetId = Number.parseInt(location.pathname.match(/^\/marketplace\/asset\/(\d+)\//i)?.[1], 10)
		if(assetId) {
			nextPage = AssetDetailsPage
			nextPageParams = [assetId]
		}
		
		//
		
		if(currPage) {
			if(nextPage === currPage && JSON.stringify(nextPageParams) === JSON.stringify(currPageParams)) {
				return // no change in page
			}
			
			currPageObj?.close?.()
			currPageParams = null
			currPage = null
		}
		
		if(nextPage) {
			currPageParams = nextPageParams
			currPageObj = new nextPage(...currPageParams)
			currPage = nextPage
		}
	}
	
	document.$watch(">body", () => {
		stateChanged()
		window.addEventListener("popstate", stateChanged)
		
		InjectJS.listen("stateChange", stateChanged)
		InjectJS.inject(() => {
			const { hijackFunction, contentScript } = window.BTRoblox
			
			hijackFunction(history, "pushState", (target, thisArg, args) => {
				const result = target.apply(thisArg, args)
				contentScript.send("stateChange")
				return result
			})
			
			hijackFunction(history, "replaceState", (target, thisArg, args) => {
				const result = target.apply(thisArg, args)
				contentScript.send("stateChange")
				return result
			})
		})
	})
}