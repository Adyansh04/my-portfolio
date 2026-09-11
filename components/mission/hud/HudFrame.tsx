/** One set of viewport corner brackets. The only place brackets are allowed. */
export function HudFrame() {
  const corner = 'absolute h-5 w-5 border-grid'
  return (
    <>
      <div className={`${corner} left-4 top-4 border-l border-t`} />
      <div className={`${corner} right-4 top-4 border-r border-t`} />
      <div className={`${corner} bottom-4 left-4 border-b border-l`} />
      <div className={`${corner} bottom-4 right-4 border-b border-r`} />
    </>
  )
}
