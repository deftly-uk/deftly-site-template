import * as migration_20260623_182755_initial from './20260623_182755_initial';
import * as migration_20260623_191440_review_fixes from './20260623_191440_review_fixes';
import * as migration_20260625_173116_multitenant_engine from './20260625_173116_multitenant_engine';

export const migrations = [
  {
    up: migration_20260623_182755_initial.up,
    down: migration_20260623_182755_initial.down,
    name: '20260623_182755_initial',
  },
  {
    up: migration_20260623_191440_review_fixes.up,
    down: migration_20260623_191440_review_fixes.down,
    name: '20260623_191440_review_fixes',
  },
  {
    up: migration_20260625_173116_multitenant_engine.up,
    down: migration_20260625_173116_multitenant_engine.down,
    name: '20260625_173116_multitenant_engine'
  },
];
