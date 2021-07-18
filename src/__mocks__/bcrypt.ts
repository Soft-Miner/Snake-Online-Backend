module.exports = {
  hash: (data: string) => data,
  compare: (data: string, encrypted: string) => data === encrypted,
};
