if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dotenv = require('dotenv');
  dotenv.config({ path: '.env.local' });
}

import { createConnection } from 'typeorm';
import app from './app';

createConnection();

const PORT = Number(process.env.PORT) || 3333;

app.listen(PORT, undefined, undefined, () => {
  console.log(`⚡️ Listening at http://localhost:${PORT}`);
});
