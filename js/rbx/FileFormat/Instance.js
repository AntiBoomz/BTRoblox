"use strict"

class RBXInstance {
	static new(className) {
		assert(typeof className === "string", "className is not a string")
		return new RBXInstance(className)
	}

	constructor(className) {
		assert(typeof className === "string", "className is not a string")
		this.Children = []
		this.Properties = []

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

	getProperty(name) {
		const descriptor = this.Properties[name]
		return descriptor ? descriptor.value : undefined
	}

	hasProperty(name) {
		return name in this.Properties
	}
}