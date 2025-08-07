"use strict"

pageInit.marketplace = () => {
	const addRipple = (elem, position) => {
		elem?.$on("mousedown", event => {
			const ripple = html`<div class=btr-replica-ripple></div>`
			elem.append(ripple)
			setTimeout(() => ripple.remove(), 1e3)
			
			if(position) {
				const rect = elem.getBoundingClientRect()
				ripple.style.left = `${event.clientX - rect.x}px`
				ripple.style.top = `${event.clientY - rect.y}px`
			}
		})
	}
	
	document.$on("mouseover", ".btr-download-popover li", event => {
		const target = event.currentTarget
		
		if(!target.dataset.btrAddedRipple) {
			target.dataset.btrAddedRipple = true
			addRipple(target, true)
		}
	})
	
	class AssetDetailsPage {
		constructor(assetId) {
			this.assetId = assetId
			this.buttons = {}
			
			RobloxApi.economy.getAssetDetails(assetId).then(json => {
				if(this.assetId !== assetId) { return }
				this.assetTypeId = json.AssetTypeId
				
				this.updateButtons()
			})
			
			this.listener = $.onDomChanged(() => {
				this.updateAnchor()
			})
			
			this.updateAnchor()
		}
		
		addButton(name, elem) {
			if(!elem) { return }
			
			this.buttons[name] = elem
			addRipple(elem.$find(">a"))
			
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
			const anchor = document.querySelector(`button[data-testid="getAsset"],button[data-testid="PLAYWRIGHT_getAsset"]`)?.parentNode || null
			if(anchor === this.anchor) { return }
			
			this.anchor = anchor
			this.updateButtons()
		}
		
		close() {
			this.listener?.disconnect()
			
			this.assetId = null
			this.assetTypeId = null
			
			this.listener = null
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
		
		const assetId = Number.parseInt(location.pathname.match(/\/(?:marketplace|store)\/asset\/(\d+)/i)?.[1], 10)
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