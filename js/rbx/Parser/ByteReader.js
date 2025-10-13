"use strict"

class ByteReader extends Uint8Array {
	static Converter = new DataView(new ArrayBuffer(8))
	
	constructor(...args) {
		if(args[0] instanceof Uint8Array) {
			args[1] = args[0].byteOffset
			args[2] = args[0].byteLength
			args[0] = args[0].buffer
		}
		
		$.assert(args[0] instanceof ArrayBuffer, "buffer is not an ArrayBuffer")
		super(...args)

		this.index = 0
		this.view = new DataView(this.buffer, this.byteOffset, this.byteLength)
	}

	SetIndex(n) { this.index = n }
	GetIndex() { return this.index }
	GetRemaining() { return this.length - this.index }
	GetLength() { return this.length }
	Jump(n) { this.index += n }

	Array(n) {
		const result = new Uint8Array(this.buffer, this.byteOffset + this.index, n)
		this.index += n
		return result
	}
	
	Match(match) {
		let index = this.index
		
		if(typeof match === "string") {
			for(let i = 0; i < match.length; i++) {
				if(match.charCodeAt(i) !== this[index++]) {
					return false
				}
			}
		} else {
			for(let i = 0; i < match.length; i++) {
				if(match[i] !== this[index++]) {
					return false
				}
			}
		}
		
		this.index += match.length
		return true
	}

	Byte() { return this.view.getUint8(this.index++) }
	UInt8() { return this.view.getUint8(this.index++) }
	UInt16LE() { return this.view.getUint16((this.index += 2) - 2, true) }
	UInt16BE() { return this.view.getUint16((this.index += 2) - 2, false) }
	UInt32LE() { return this.view.getUint32((this.index += 4) - 4, true) }
	UInt32BE() { return this.view.getUint32((this.index += 4) - 4, false) }
	UInt64LE() { return this.view.getBigUint64((this.index += 8) - 8, true) }
	UInt64BE() { return this.view.getBigUint64((this.index += 8) - 8, false) }

	Int8() { return this.view.getInt8(this.index++) }
	Int16LE() { return this.view.getInt16((this.index += 2) - 2, true) }
	Int16BE() { return this.view.getInt16((this.index += 2) - 2, false) }
	Int32LE() { return this.view.getInt32((this.index += 4) - 4, true) }
	Int32BE() { return this.view.getInt32((this.index += 4) - 4, false) }
	Int64LE() { return this.view.getBigInt64((this.index += 8) - 8, true) }
	Int64BE() { return this.view.getBigInt64((this.index += 8) - 8, false) }
	
	FloatLE() { return this.view.getFloat32((this.index += 4) - 4, true) }
	FloatBE() { return this.view.getFloat32((this.index += 4) - 4, false) }
	DoubleLE() { return this.view.getFloat64((this.index += 8) - 8, true) }
	DoubleBE() { return this.view.getFloat64((this.index += 8) - 8, false) }

	String(n) { return $.bufferToString(this.Array(n)) }

	// LZ4
	
	LZ4Header() {
		const comLength = this.UInt32LE()
		const decomLength = this.UInt32LE()
		const checksum = this.Jump(4) // always 0
		
		return [comLength, decomLength]
	}
	
	LZ4(buffer) {
		const [comLength, decomLength] = this.LZ4Header()
		
		if(comLength === 0) {
			$.assert(this.GetRemaining() >= decomLength, "[ByteReader.LZ4Header] unexpected eof")
			return this.Array(decomLength)
		}
		
		$.assert(this.GetRemaining() >= comLength, "[ByteReader.LZ4Header] unexpected eof")
		
		if(!buffer || buffer.length < decomLength) {
			buffer = new Uint8Array(decomLength)
		}
		
		const data = buffer.length > decomLength ? buffer.subarray(0, decomLength) : buffer
		const endIndex = this.index + comLength
		
		let lastByte = 0
		let index = 0

		while(index < decomLength) {
			const token = this[this.index++]
			let literalLength = token >> 4

			if(literalLength === 0xF) {
				do {
					lastByte = this[this.index++]
					literalLength += lastByte
				} while(lastByte === 0xFF)
			}
			
			$.assert(this.index + literalLength <= endIndex, "[ByteReader.LZ4] unexpected eof")

			for(let i = 0; i < literalLength; i++) {
				data[index++] = this[this.index++]
			}

			if(index < decomLength) {
				let matchIndex = index - this.UInt16LE()
				let matchLength = token & 0xF

				if(matchLength === 0xF) {
					do {
						lastByte = this[this.index++]
						matchLength += lastByte
					} while(lastByte === 0xFF)
				}
				
				matchLength += 4 // Minimum match is 4 bytes, so 4 is added to the length
				
				$.assert(index + matchLength <= decomLength, "[ByteReader.LZ4] output size mismatch")
				
				for(let i = 0; i < matchLength; i++) {
					data[index++] = data[matchIndex++]
				}
			}
		}

		$.assert(this.index === endIndex, "[ByteReader.LZ4] input size mismatch")
		$.assert(index === decomLength, "[ByteReader.LZ4] output size mismatch")
		
		return data
	}

	// RBX

	RBXFloat() {
		const uint32 = this.UInt32LE()
		ByteReader.Converter.setUint32(0, uint32 << 31 | uint32 >>> 1)
		return ByteReader.Converter.getFloat32(0)
	}
	
	RBXInterleavedUint16(count, result) {
		for(let i = 0; i < count; i++) {
			result[i] =
				this[this.index + i + count * 0] << 8 |
				this[this.index + i + count * 1]
		}

		this.Jump(count * 2)
		return result
	}
	
	RBXInterleavedUint32(count, result) {
		for(let i = 0; i < count; i++) {
			result[i] =
				this[this.index + i + count * 0] << 24 |
				this[this.index + i + count * 1] << 16 |
				this[this.index + i + count * 2] << 8 |
				this[this.index + i + count * 3]
		}

		this.Jump(count * 4)
		return result
	}
	
	RBXInterleavedUint64(count, result) {
		for(let i = 0; i < count; i++) {
			result[i] = BigInt(
				this[this.index + i + count * 0] << 24 |
				this[this.index + i + count * 1] << 16 |
				this[this.index + i + count * 2] << 8 |
				this[this.index + i + count * 3]
			) * (2n ** 32n) + BigInt(
				this[this.index + i + count * 4] << 24 |
				this[this.index + i + count * 5] << 16 |
				this[this.index + i + count * 6] << 8 |
				this[this.index + i + count * 7]
			)
		}

		this.Jump(count * 8)
		return result
	}
	
	RBXInterleavedInt16(count, result) {
		this.RBXInterleavedUint16(count, result)
		
		for(let i = 0; i < count; i++) {
			const value = result[i]
			result[i] = (value % 2 ? -(value + 1) / 2 : value / 2)
		}
		
		return result
	}

	RBXInterleavedInt32(count, result) {
		this.RBXInterleavedUint32(count, result)
		
		for(let i = 0; i < count; i++) {
			const value = result[i]
			result[i] = (value % 2 ? -(value + 1) / 2 : value / 2)
		}
		
		return result
	}
	
	RBXInterleavedInt64(count, result) {
		this.RBXInterleavedUint64(count, result)
		
		for(let i = 0; i < count; i++) {
			const value = result[i]
			result[i] = (value % 2n ? -(value + 1n) / 2n : value / 2n)
		}
		
		return result
	}

	RBXInterleavedFloat(count, result) {
		this.RBXInterleavedUint32(count, result)
		
		for(let i = 0; i < count; i++) {
			const uint32 = result[i]
			ByteReader.Converter.setUint32(0, uint32 << 31 | uint32 >>> 1)
			result[i] =  ByteReader.Converter.getFloat32(0)
		}
		
		return result
	}
}

{
	const peekMethods = [
		"Byte", "UInt8", "UInt16LE", "UInt16BE", "UInt32LE", "UInt32BE",
		"FloatLE", "FloatBE", "DoubleLE", "DoubleBE", "Array", "String"
	]
	
	for(const key of peekMethods) {
		const fn = ByteReader.prototype[key]
		
		ByteReader.prototype["Peek" + key] = function(...args) {
			const index = this.GetIndex()
			const result = fn.apply(this, args)
			this.SetIndex(index)
			return result
		}
	}
}