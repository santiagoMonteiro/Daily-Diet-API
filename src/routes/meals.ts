import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Meal } from '../@types/meal'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [checkSessionIdExists] }, async (request) => {
    const { sessionId } = request.cookies

    const meals = await knex('meals')
      .select()
      .where('session_id', sessionId)
      .orderBy('datetime')

    return {
      meals,
    }
  })

  app.get('/:id', { preHandler: [checkSessionIdExists] }, async (request) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealParamsSchema.parse(request.params)

    const { sessionId } = request.cookies

    const meal = await knex('meals')
      .select()
      .where({ id, session_id: sessionId })

    return {
      meal,
    }
  })

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
