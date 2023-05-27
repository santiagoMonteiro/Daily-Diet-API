// eslint-disable-next-line
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    meals: {
      id: string
      session_id?: string
      title: string
      description: string
      datetime: Date
      according_to_the_diet: boolean
      created_at: Date
      updated_at?: Date
    }
  }
}
