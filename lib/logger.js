const isProd = process.env.NODE_ENV === 'production'

export const logger = {
  info:  (...args) => { if (!isProd) console.info('[info]',  ...args) },
  warn:  (...args) => { if (!isProd) console.warn('[warn]',  ...args) },
  error: (...args) => { if (!isProd) console.error('[error]', ...args) },
}
