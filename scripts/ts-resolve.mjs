/**
 * Resolve hook so the check scripts can import the app's TypeScript modules directly
 * (Node strips the types itself; it just won't guess the extension on `./zones`).
 */
export async function resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
    try {
      return await next(`${specifier}.ts`, context)
    } catch {
      /* fall through to the plain specifier */
    }
  }
  return next(specifier, context)
}
