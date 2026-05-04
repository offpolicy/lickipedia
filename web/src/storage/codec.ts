import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate'
import type { Lick } from '../grid/lick'

const PREFIX = 'lp1:'

function b64urlEncode(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)
  const bin = atob(padded)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function encodeLick(lick: Lick): string {
  const json = JSON.stringify(lick)
  const compressed = deflateSync(strToU8(json))
  return PREFIX + b64urlEncode(compressed)
}

export function decodeLick(s: string): Lick {
  if (!s.startsWith(PREFIX)) throw new Error('Not a lickipedia v1 string')
  try {
    const bytes = b64urlDecode(s.slice(PREFIX.length))
    const json = strFromU8(inflateSync(bytes))
    return JSON.parse(json) as Lick
  } catch {
    throw new Error('Malformed lp1 string')
  }
}
