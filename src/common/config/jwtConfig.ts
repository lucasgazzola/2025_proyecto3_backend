export const config = {
  auth: {
    secret: 'authSecret',
    expiresIn: '1d',
  },
  refresh: {
    secret: 'refreshSecret',
    expiresIn: '1d',
  },
  reset: {
    secret: 'resetSecret',
    expiresIn: '15m',
  },
};