"use strict"

class ByteReader extends Uint8Array {
	static ParseFloat(long) {
		const exp = (long >>> 23) & 255
		if(exp === 0) { return 0 }
		const float = 2 ** (exp - 127) * (1 + (long & 0x7FFFFF) / 0x7FFFFF)
		return long > 0x7FFFFFFF ? -float : float
	}

	static ParseRBXFloat(long) {
		const exp = long >>> 24
		if(exp === 0) { return 0 }
		const float = 2 ** (exp - 127) * (1 + ((long >>> 1) & 0x7FFFFF) / 0x7FFFFF)
		return long & 1 ? -float : float
	}

	static ParseDouble(long0, long1) {
		const exp = (long0 >>> 20) & 0x7FF
		const frac = (((long0 & 1048575) * 4294967296) + long1) / 4503599627370496
		const neg = long0 & 2147483648

		if(exp === 0) {
			if(frac === 0) { return -0 }
			const double = 2 ** (exp - 1023) * frac
			return neg ? -double : double
		} else if(exp === 2047) {
			return frac === 0 ? Infinity : NaN
		}

		const double = 2 ** (exp - 1023) * (1 + frac)
		return neg ? -double : double
	}

	constructor(...args) {
		if(args[0] instanceof Uint8Array) {
			args[1] = args[0].byteOffset
			args[2] = args[0].byteLength
			args[0] = args[0].buffer
		}
		
		assert(args[0] instanceof ArrayBuffer, "buffer is not an ArrayBuffer")
		super(...args)

		this.index = 0
	}

	SetIndex(n) { this.index = n }
	GetIndex() { return this.index }
	GetRemaining() { return this.length - this.index }
	GetLength() { return this.length }
	Jump(n) { this.index += n }

	Array(n) {
		const result = new Uint8Array(this.buffer, this.index, n)
		this.index += n
		return result
	}

	Match(arr) {
		const begin = this.index
		this.index += arr.length
		for(let i = 0; i < arr.length; i++) {
			if(arr[i] !== this[begin + i]) { return false }
		}
		return true
	}

	Byte() { return this[this.index++] }
	UInt8() { return this[this.index++] }
	UInt16LE() { return this[this.index++] + (this[this.index++] * 256) }
	UInt16BE() { return (this[this.index++] * 256) + this[this.index++] }
	UInt32LE() { return this[this.index++] + (this[this.index++] * 256) + (this[this.index++] * 65536) + (this[this.index++] * 16777216) }
	UInt32BE() { return (this[this.index++] * 16777216) + (this[this.index++] * 65536) + (this[this.index++] * 256) + this[this.index++] }

	Int8() { return (this[this.index++]) << 24 >> 24 }
	Int16LE() { return (this[this.index++] + (this[this.index++] * 256)) << 16 >> 16 }
	Int16BE() { return ((this[this.index++] * 256) + this[this.index++]) << 16 >> 16 }
	Int32LE() { return (this[this.index++] + (this[this.index++] * 256) + (this[this.index++] * 65536) + (this[this.index++] * 16777216)) >> 0 }
	Int32BE() { return ((this[this.index++] * 16777216) + (this[this.index++] * 65536) + (this[this.index++] * 256) + this[this.index++]) >> 0 }

	FloatLE() { return ByteReader.ParseFloat(this.UInt32LE()) }
	FloatBE() { return ByteReader.ParseFloat(this.UInt32BE()) }
	DoubleLE() {
		const byte = this.UInt32LE()
		return ByteReader.ParseDouble(this.UInt32LE(), byte)
	}
	DoubleBE() { return ByteReader.ParseDouble(this.UInt32BE(), this.UInt32BE()) }

	String(n) {
		return bufferToString(this.Array(n))
	}

	// Custom stuff
	LZ4(buffer) {
		const comLength = this.UInt32LE()
		const decomLength = this.UInt32LE()
		this.Jump(4)

		if(comLength === 0) { // TOOD: This path is actually not supported by Roblox, may have to take a look at some point?
			assert(this.GetRemaining() >= decomLength, "[ByteReader.LZ4] unexpected eof")
			return this.Array(decomLength)
		}
		
		assert(this.GetRemaining() >= comLength, "[ByteReader.LZ4] unexpected eof")
		
		if(!buffer || buffer.length < decomLength) {
			buffer = new Uint8Array(decomLength)
		}

		const start = this.index
		const end = start + comLength
		const data = buffer.length === decomLength ? buffer : buffer.subarray(0, decomLength)
		let index = 0

		while(this.index < end) {
			const token = this.Byte()
			let litLen = token >>> 4

			if(litLen === 0xF) {
				while(true) {
					const lenByte = this.Byte()
					litLen += lenByte
					if(lenByte !== 0xFF) { break }
				}
			}
			
			assert(this.index + litLen <= end, "[ByteReader.LZ4] unexpected eof")

			for(let i = 0; i < litLen; i++) {
				data[index++] = this.Byte()
			}

			if(this.index < end) {
				const offset = this.UInt16LE()
				const begin = index - offset
				
				let len = token & 0xF

				if(len === 0xF) {
					while(true) {
						const lenByte = this.Byte()
						len += lenByte
						if(lenByte !== 0xFF) { break }
					}
				}

				len += 4
				
				for(let i = 0; i < len; i++) {
					data[index++] = data[begin + i]
				}
			}
		}

		assert(this.index === end, "[ByteReader.LZ4] input size mismatch")
		assert(index === decomLength, "[ByteReader.LZ4] output size mismatch")
		
		return data
	}

	// RBX

	RBXFloatLE() { return ByteReader.ParseRBXFloat(this.UInt32LE()) }
	RBXFloatBE() { return ByteReader.ParseRBXFloat(this.UInt32BE()) }
	
	RBXInterleavedUint32(count, result) {
		for(let i = 0; i < count; i++) {
			result[i] = (this[this.index + i] << 24)
				+ (this[this.index + i + count] << 16)
				+ (this[this.index + i + count * 2] << 8)
				+ (this[this.index + i + count * 3])
		}

		this.Jump(count * 4)
		return result
	}

	RBXInterleavedInt32(count, result) {
		this.RBXInterleavedUint32(count, result)
		
		for(let i = 0; i < count; i++) {
			result[i] = (result[i] % 2 === 1 ? -(result[i] + 1) / 2 : result[i] / 2)
		}
		
		return result
	}

	RBXInterleavedFloat(count, result) {
		this.RBXInterleavedUint32(count, result)
		
		for(let i = 0; i < count; i++) {
			result[i] = ByteReader.ParseRBXFloat(result[i])
		}
		
		return result
	}
}

{
	const peekMethods = [
		"Byte", "UInt8", "UInt16LE", "UInt16BE", "UInt32LE", "UInt32BE",
		"FloatLE", "FloatBE", "DoubleLE", "DoubleBE", "String"
	]

	peekMethods.forEach(key => {
		const fn = ByteReader.prototype[key]
		ByteReader.prototype["Peek" + key] = function(...args) {
			const index = this.GetIndex()
			const result = fn.apply(this, args)
			this.SetIndex(index)
			return result
		}
	})
}