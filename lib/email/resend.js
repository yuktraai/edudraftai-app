import { Resend } from 'resend'

// Lazy singleton — instantiated on first use so build-time module load
// doesn't throw when RESEND_API_KEY is absent in the build environment.
let _client = null

export function getResend() {
  if (!_client) {
    _client = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
  }
  return _client
}
