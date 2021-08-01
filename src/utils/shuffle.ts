// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const shuffle = <T>(array: Array<T>): Array<T> => {
  const arrayShuffled = [...array];
  let currentIndex = arrayShuffled.length,
    randomIndex;

  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [arrayShuffled[currentIndex], arrayShuffled[randomIndex]] = [
      arrayShuffled[randomIndex],
      arrayShuffled[currentIndex],
    ];
  }

  return arrayShuffled;
};
