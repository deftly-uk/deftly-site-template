/**
 * Minimal builders for Payload Lexical rich-text values used by the seed.
 * Keeps the seed readable instead of inlining huge JSON blobs.
 */

type LexNode = Record<string, unknown>

const textNode = (text: string): LexNode => ({
  type: 'text',
  version: 1,
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text,
})

export const paragraph = (text: string): LexNode => ({
  type: 'paragraph',
  version: 1,
  direction: 'ltr',
  format: '',
  indent: 0,
  textFormat: 0,
  children: [textNode(text)],
})

export const heading = (text: string, tag: 'h2' | 'h3' = 'h2'): LexNode => ({
  type: 'heading',
  tag,
  version: 1,
  direction: 'ltr',
  format: '',
  indent: 0,
  children: [textNode(text)],
})

// Returns `any` because Payload's generated Lexical field type is extremely strict
// (literal unions for direction/format); the runtime shape here is correct.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const richText = (children: LexNode[]): any => ({
  root: {
    type: 'root',
    version: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    children,
  },
})
