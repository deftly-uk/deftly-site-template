export type ContactState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Partial<Record<'name' | 'phone' | 'postcode' | 'message', string>>
}

export const initialContactState: ContactState = { status: 'idle' }
