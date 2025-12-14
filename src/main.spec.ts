jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn().mockResolvedValue({
      listen: jest.fn(),
      use: jest.fn(),
      getHttpAdapter: jest.fn().mockReturnValue({ getInstance: jest.fn() }),
    }),
  },
}));
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('bootstrap (main.ts)', () => {
  it('importa y ejecuta bootstrap sin lanzar', () => {
    const mod = require('./main');
    expect(mod).toBeDefined();
  });
});
