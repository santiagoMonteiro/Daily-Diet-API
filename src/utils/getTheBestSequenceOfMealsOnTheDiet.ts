export function getTheBestSequenceOfMealsOnTheDiet(meals: boolean[]) {
  let bestSequence = 0
  let counter = 0

  for (let i = 0; i < meals.length; i++) {
    const mealOnTheDiet = meals[i]

    if (mealOnTheDiet) {
      counter = counter + 1
    } else {
      counter = 0
    }

    if (counter > bestSequence) {
      bestSequence = counter
    }
  }

  return bestSequence
}
