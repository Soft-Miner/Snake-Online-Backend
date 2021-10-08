import { randomIntBetween } from './randomIntBetween';

export const randomElement = <T>(array: Array<T>): T => {
  return array[randomIntBetween(0, array.length - 1)];
};
