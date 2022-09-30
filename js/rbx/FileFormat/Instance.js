"use strict"

const RBXInstanceUtils = {
	findFirstChild(target, name, recursive = false) {
		const children = target instanceof RBXInstance ? target.Children : target
		
		for(const child of children) {
			if(child.getProperty("Name") === name) {
				return child
			}
		}
		
		if(recursive) {
			const arrays = [children]
			
			while(arrays.length) {
				for(const desc of arrays.shift()) {
					if(desc.getProperty("Name") === name) {
						return desc
					}
					
					if(desc.Children.length) {
						arrays.push(desc.Children)
					}
				}
			}
		}
		
		return null
	},
	
	findFirstChildOfClass(target, className, recursive = false) {
		const children = target instanceof RBXInstance ? target.Children : target
		
		for(const child of children) {
			if(child.getProperty("ClassName") === className) {
				return child
			}
		}
		
		if(recursive) {
			const arrays = [children]
			
			while(arrays.length) {
				for(const desc of arrays.shift()) {
					if(desc.getProperty("ClassName") === className) {
						return desc
					}
					
					if(desc.Children.length) {
						arrays.push(desc.Children)
					}
				}
			}
		}
		
		return null
	}
}

class RBXInstanceRoot extends Array {
	findFirstChild(...args) { return RBXInstanceUtils.findFirstChild(this, ...args) }
	findFirstChildOfClass(...args) { return RBXInstanceUtils.findFirstChildOfClass(this, ...args) }
}

class RBXInstance {
	static new(className) {
		assert(typeof className === "string", "className is not a string")
		return new RBXInstance(className)
	}

	constructor(className) {
		assert(typeof className === "string", "className is not a string")
		
		this.Children = []
		this.Properties = {}

		this.setProperty("ClassName", className, "string")
		this.setProperty("Name", "Instance", "string")
		this.setProperty("Parent", null, "Instance")
	}

	setProperty(name, value, type) {
		if(!type) {
			if(typeof value === "boolean") {
				type = "bool"
			} else if(value instanceof RBXInstance) {
				type = "Instance"
			} else {
				throw new TypeError("You need to specify property type")
			}
		}

		let descriptor = this.Properties[name]
		if(descriptor) {
			assert(descriptor.type === type, `Property type mismatch ${type} !== ${descriptor.type}`)

			if(name === "Parent" && descriptor.value instanceof RBXInstance) {
				const index = descriptor.value.Children.indexOf(this)
				if(index !== -1) {
					descriptor.value.Children.splice(index, 1)
				}
			}

			descriptor.value = value
		} else {
			descriptor = this.Properties[name] = { type, value }
		}

		if(name === "Parent") {
			if(descriptor.value instanceof RBXInstance) {
				descriptor.value.Children.push(this)
			}
		}

		if(name !== "Children" && name !== "Properties" && !(name in Object.getPrototypeOf(this))) {
			this[name] = value
		}
	}
	
	getProperty(name, caseInsensitive = false) {
		const descriptor = this.Properties[name] || caseInsensitive && Object.entries(this.Properties).find(x => x[0].toLowerCase() === name.toLowerCase())?.[1]
		return descriptor ? descriptor.value : undefined
	}

	hasProperty(name, caseInsensitive = false) {
		return name in this.Properties || caseInsensitive && !Object.entries(this.Properties).find(x => x[0].toLowerCase() === name.toLowerCase())
	}
	
	findFirstChild(...args) { return RBXInstanceUtils.findFirstChild(this, ...args) }
	findFirstChildOfClass(...args) { return RBXInstanceUtils.findFirstChildOfClass(this, ...args) }
}