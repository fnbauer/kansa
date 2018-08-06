import { Map } from 'immutable'

export const fields = [
  'membership',
  'legal_name',
  'email',
  'public_first_name',
  'public_last_name',
  'country',
  'state',
  'city',
  'paper_pubs'
]

export const emptyPaperPubsMap = Map({ name: '', address: '', country: '' })
