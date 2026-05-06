beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_secret_key';
  process.env.PORT = '3001';
});

afterAll(async () => {
  jest.restoreAllMocks();
});