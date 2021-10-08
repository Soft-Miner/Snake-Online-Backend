import { randomIntBetween } from './randomIntBetween';

export const randomDirection = () => {
  const directions = [
    {
      x: 0,
      y: -1,
    },
    {
      x: 0,
      y: 1,
    },
    {
      x: -1,
      y: 0,
    },
    {
      x: 1,
      y: 0,
    },
  ];

  return directions[randomIntBetween(0, 3)];
};
