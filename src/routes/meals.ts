import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Meal } from '../@types/meal'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'
import { getTheBestSequenceOfMealsOnTheDiet } from '../utils/getTheBestSequenceOfMealsOnTheDiet'

const mealBodySchema = z.object({
  title: z.string(),
  description: z.string(),
  datetime: z.string(),
  accordingToTheDiet: z.boolean(),
})

const mealIdParamSchema = z.object({
  id: z.string().uuid(),
})

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

  app.get(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { id } = mealIdParamSchema.parse(request.params)

      const { sessionId } = request.cookies

      const meal = await knex('meals')
        .select()
        .where({ id, session_id: sessionId })

      if (meal.length === 0) {
        return reply.status(404).send({
          error: 'Resource not found',
          message: 'The resource you want to access does not exist',
        })
      }

      return {
        meal,
      }
    },
  )

  app.get(
    '/summary',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const meals = await knex('meals').select('*').orderBy('datetime')

      const mealsInBooleanFormat = meals.map((meal) => {
        return meal.according_to_the_diet
      })

      const mealsOnTheDiet = mealsInBooleanFormat.filter((booleanValue) => {
        return booleanValue
      })

      const bestSequenceOfMeals =
        getTheBestSequenceOfMealsOnTheDiet(mealsInBooleanFormat)

      const metrics = {
        amountOfMeals: meals.length,
        numberOfMealsOnTheDiet: mealsOnTheDiet.length,
        numberOfMealsOffTheDiet: meals.length - mealsOnTheDiet.length,
        bestSequenceOfMeals,
      }

      return reply.status(200).send(metrics)
    },
  )

  app.post('/', async (request, reply) => {
    const { title, description, datetime, accordingToTheDiet } =
      mealBodySchema.parse(request.body)

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

  app.put(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { title, description, datetime, accordingToTheDiet } =
        mealBodySchema.parse(request.body)

      const { id } = mealIdParamSchema.parse(request.params)

      const { sessionId } = request.cookies

      const updateMealQuery = await knex('meals')
        .where({ id, session_id: sessionId })
        .update({
          title,
          description,
          datetime: new Date(datetime),
          according_to_the_diet: accordingToTheDiet,
        })

      if (!updateMealQuery) {
        return reply.status(404).send({
          error: 'Resource not found',
          message: 'The resource you want to edit does not exist',
        })
      }

      return reply.status(200).send()
    },
  )

  app.delete(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { id } = mealIdParamSchema.parse(request.params)
      const { sessionId } = request.cookies

      const deleteMealQuery = await knex('meals')
        .where({
          id,
          session_id: sessionId,
        })
        .del()

      if (!deleteMealQuery) {
        return reply.status(404).send({
          error: 'Resource not found',
          message: 'The resource you want to delete does not exist',
        })
      }

      return reply.status(204).send()
    },
  )
}
