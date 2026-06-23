import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import React from 'react'

type Props = {
  data?: SerializedEditorState | null | unknown
  className?: string
}

/** Renders Payload Lexical rich text from the CMS. Returns null when empty. */
export const RichText: React.FC<Props> = ({ data, className }) => {
  if (!data || typeof data !== 'object') return null
  return <LexicalRichText data={data as SerializedEditorState} className={className} />
}

export default RichText
