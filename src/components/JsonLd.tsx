import React from 'react'

// Escape HTML-significant characters so CMS content can never break out of the
// <script> tag (e.g. a literal </script> in a field). The \uXXXX escapes parse
// back to the original characters inside JSON, so the structured data is unchanged.
const safeJson = (data: Record<string, unknown>): string =>
  JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')

/** Injects JSON-LD structured data (LocalBusiness) into the page head/body. */
export const JsonLd: React.FC<{ data: Record<string, unknown> }> = ({ data }) => (
  <script
    type="application/ld+json"
    // eslint-disable-next-line react/no-danger
    dangerouslySetInnerHTML={{ __html: safeJson(data) }}
  />
)

export default JsonLd
