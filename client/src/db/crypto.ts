const DEVICE_KEY_STORAGE_KEY = 'safe.deviceKey.v1'

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

const toBase64 = (bytes: Uint8Array): string => {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
}

const fromBase64 = (value: string): ArrayBuffer => {
  const binary = atob(value)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return bytes.buffer
}

const getOrCreateDeviceKey = async (): Promise<CryptoKey> => {
  const storedKey = localStorage.getItem(DEVICE_KEY_STORAGE_KEY)

  if (storedKey) {
    return crypto.subtle.importKey('raw', fromBase64(storedKey), 'AES-GCM', true, [
      'encrypt',
      'decrypt',
    ])
  }

  const key = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt'],
  )

  const rawKey = new Uint8Array(await crypto.subtle.exportKey('raw', key))
  localStorage.setItem(DEVICE_KEY_STORAGE_KEY, toBase64(rawKey))

  return key
}

export const encryptJson = async (payload: unknown): Promise<string> => {
  const key = await getOrCreateDeviceKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = textEncoder.encode(JSON.stringify(payload))
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data),
  )

  const combined = new Uint8Array(iv.length + encrypted.length)
  combined.set(iv)
  combined.set(encrypted, iv.length)

  return toBase64(combined)
}

export const decryptJson = async <T>(cipherText: string): Promise<T> => {
  const key = await getOrCreateDeviceKey()
  const combined = new Uint8Array(fromBase64(cipherText))
  const iv = combined.slice(0, 12)
  const encrypted = combined.slice(12)

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted)

  return JSON.parse(textDecoder.decode(decrypted)) as T
}

export const makeEncryptedUid = async (rawIdentifier: string): Promise<string> => {
  const cipher = await encryptJson({ rawIdentifier, timestamp: Date.now() })
  return cipher.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}
