export interface Meal {
  id: string
  session_id?: string
  title: string
  description: string
  datetime: Date
  according_to_the_diet: boolean
}
