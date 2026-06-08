import { clearTestDb, closeTestDb } from './mocks/testDb.js';

beforeEach(() => {
  clearTestDb();
});

afterAll(() => {
  closeTestDb();
});
