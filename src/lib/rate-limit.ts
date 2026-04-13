type RateLimitBucket = {
  count: number
  resetAt: number
}

type HeaderBag = Headers | Record<string, string | string[] | undefined> | undefined

const store = new Map<string, RateLimitBucket>()
const MAX_BUCKETS = 10000

const sanitizeHeaderValue = (value: string) => value.split(",")[0]?.trim() || ""

export function getIpFromHeaderBag(headers: HeaderBag): string {
  if (!headers) return "unknown"

  if (headers instanceof Headers) {
    const forwarded = headers.get("x-forwarded-for")
    if (forwarded) return sanitizeHeaderValue(forwarded)

    const realIp = headers.get("x-real-ip") || headers.get("cf-connecting-ip")
    if (realIp) return sanitizeHeaderValue(realIp)

    return "unknown"
  }

  const forwarded = headers["x-forwarded-for"]
  if (typeof forwarded === "string") return sanitizeHeaderValue(forwarded)
  if (Array.isArray(forwarded) && forwarded.length > 0) return sanitizeHeaderValue(forwarded[0] || "")

  const realIp = headers["x-real-ip"] || headers["cf-connecting-ip"]
  if (typeof realIp === "string") return sanitizeHeaderValue(realIp)
  if (Array.isArray(realIp) && realIp.length > 0) return sanitizeHeaderValue(realIp[0] || "")

  return "unknown"
}

export function getClientIp(request: Request): string {
  return getIpFromHeaderBag(request.headers)
}

export function consumeRateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now()

  if (store.size > MAX_BUCKETS) {
    for (const [bucketKey, bucket] of store.entries()) {
      if (bucket.resetAt <= now) {
        store.delete(bucketKey)
      }
    }
  }

  const current = store.get(key)

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { ok: true, remaining: max - 1, resetAt }
  }

  current.count += 1
  store.set(key, current)

  return {
    ok: current.count <= max,
    remaining: Math.max(0, max - current.count),
    resetAt: current.resetAt,
  }
}

export function applyRateLimit(
  request: Request,
  scope: string,
  options: { max: number; windowMs: number }
) {
  const ip = getClientIp(request)
  return consumeRateLimit(`${scope}:${ip}`, options.max, options.windowMs)
}
