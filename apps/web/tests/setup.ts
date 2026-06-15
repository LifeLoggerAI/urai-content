import { afterEach } from 'vitest';
import { resetRuntimeMemoryRepositoryForTests } from '../src/server/content/service';

afterEach(() => {
  resetRuntimeMemoryRepositoryForTests();
});
