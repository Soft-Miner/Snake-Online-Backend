if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dotenv = require('dotenv');
  dotenv.config({ path: '.env.local' });
}

import { createConnection } from 'typeorm';
createConnection();

import app from './app';

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`⚡️ Listening at http://localhost:${PORT}`);
});
