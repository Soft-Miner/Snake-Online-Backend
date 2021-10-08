if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dotenv = require('dotenv');
  dotenv.config({ path: '.env.local' });
}

import { createConnection } from 'typeorm';
import app from './app';
import { configureColyseus } from './colyseus';

createConnection();

const PORT = Number(process.env.PORT) || 3333;

const gameServer = configureColyseus(app);

gameServer.listen(PORT, undefined, undefined, () => {
  console.log(`⚡️ Listening at http://localhost:${PORT}`);
});
