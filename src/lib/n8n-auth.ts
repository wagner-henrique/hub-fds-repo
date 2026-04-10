import crypto from "node:crypto"

const N8N_API_KEY_ENV = "N8N_API_KEY"

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

export function getN8nTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization")
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim()
  }

  return (
    request.headers.get("n8n_api_key") ||
    request.headers.get("N8N_API_KEY") ||
    request.headers.get("x-n8n-key") ||
    request.headers.get("x-api-key") ||
    null
  )
}

export function isN8nAuthorized(request: Request): boolean {
  const expectedToken = process.env[N8N_API_KEY_ENV]
  if (!expectedToken) {
    return false
  }

  const providedToken = getN8nTokenFromRequest(request)
  if (!providedToken) {
    return false
  }

  return safeEqual(expectedToken, providedToken)
}
