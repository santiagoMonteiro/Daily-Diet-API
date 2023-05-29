import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Meal } from '../@types/meal'
import { knex } from '../database'

export async function mealsRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createMealBodySchema = z.object({
      title: z.string(),
      description: z.string(),
      datetime: z.string(),
      accordingToTheDiet: z.boolean(),
    })

    const { title, description, datetime, accordingToTheDiet } =
      createMealBodySchema.parse(request.body)

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      const maxAgeOfCookie = 1000 * 60 * 60 * 24 * 7 // seven days

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: maxAgeOfCookie,
      })
    }

    const meal: Meal = {
      id: randomUUID(),
      session_id: sessionId,
      title,
      description,
      datetime: new Date(datetime),
      according_to_the_diet: accordingToTheDiet,
    }

    await knex('meals').insert(meal)

    return reply.status(201).send()
  })
}
