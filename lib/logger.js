const isProd = process.env.NODE_ENV === 'production'

export const logger = {
  info:  (...args) => { if (!isProd) console.info('[info]',  ...args) },
  warn:  (...args) => { if (!isProd) console.warn('[warn]',  ...args) },
  // Errors always log — even in production — so Vercel Function Logs capture them
  error: (...args) => { console.error('[error]', ...args) },
}
