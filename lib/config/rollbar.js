import Rollbar from 'rollbar';

export const rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true,
  payload: { environment: process.env.ROLLBAR_ENVIRONMENT || 'production' },
});
