export function createStringify(opts = {}) {
  const maxDepth = Number.isFinite(opts.maxDepth) ? opts.maxDepth : Infinity
  const native = JSON.stringify

  return function stringify(value, replacer, space) {
    const gap = typeof space === 'number'
      ? ' '.repeat(Math.min(10, space))
      : typeof space === 'string'
      ? space.slice(0, 10)
      : ''
    const allowList = Array.isArray(replacer)
      ? new Set(replacer.map(String))
      : null
    const replaceFn = typeof replacer === 'function' ? replacer : null
    const seen = new Set()

    function quote(str) {
      // delegate escaping to the native stringifier
      return native(str)
    }
    function pad(n) { return gap ? gap.repeat(n) : '' }

    function applyReplacer(holder, key, v) {
      if (v && typeof v === 'object' && typeof v.toJSON === 'function') {
        v = v.toJSON(key)
      }
      if (replaceFn) v = replaceFn.call(holder, key, v)
      return v
    }

    function keysOf(obj) {
      if (!allowList) return Object.keys(obj)
      return Object.keys(obj).filter(k => allowList.has(k))
    }

    function serialize(holder, key, level) {
      let v = applyReplacer(holder, key, holder[key])

      switch (typeof v) {
        case 'string': return quote(v)
        case 'number': return isFinite(v) ? String(v) : 'null'
        case 'boolean': return String(v)
        case 'bigint':
          throw new TypeError('Do not know how to serialize a BigInt')
        case 'undefined':
        case 'function':
        case 'symbol':
          // Undefined & functions are dropped in objects, "null" in arrays handled later
          return undefined
        case 'object':
          if (v === null) return 'null'
          if (seen.has(v)) throw new TypeError('Converting circular structure to JSON')

          // At or beyond the cutoff? Compact-serialize without pretty wrapping.
          if (level >= maxDepth) {
            // Respect replacer semantics at the cut-off too.
            const compactReplacer = replaceFn
              ? replaceFn
              : allowList
              ? (k, vv) => (allowList.has(k) ? vv : undefined)
              : undefined
            return native(v, compactReplacer) // no space => no wrapping
          }

          seen.add(v)
          let result
          if (Array.isArray(v)) {
            const parts = []
            for (let i = 0; i < v.length; i++) {
              const item = serialize(v, String(i), level + 1)
              parts.push(item === undefined ? 'null' : item)
            }
            if (!gap) {
              result = `[${parts.join(',')}]`
            } else {
              const inner = parts.map(p => pad(level + 1) + p).join(',\n')
              result = `[\n${inner}\n${pad(level)}]`
            }
          } else {
            const ks = keysOf(v)
            const parts = []
            for (const k of ks) {
              const prop = serialize(v, k, level + 1)
              if (prop !== undefined) {
                parts.push(quote(k) + (gap ? ': ' : ':') + prop)
              }
            }
            if (!gap) {
              result = `{${parts.join(',')}}`
            } else {
              const inner = parts.map(p => pad(level + 1) + p).join(',\n')
              result = `{\n${inner}\n${pad(level)}}`
            }
          }
          seen.delete(v)
          return result
        default:
          return undefined
      }
    }

    // Emulate native behavior for the root
    return serialize({ '': value }, '', 0)
  }
}

export const stringify = createStringify({ maxDepth: 2 });
