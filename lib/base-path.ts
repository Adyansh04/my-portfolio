/** Next only prefixes <Link>/<Image>/router with basePath — loaders, fetch and plain <a href> need it by hand. */
export const BASE = '/my-portfolio'
export const asset = (path: string) => `${BASE}${path.startsWith('/') ? path : `/${path}`}`
