import * as migration_20260623_182755_initial from './20260623_182755_initial';

export const migrations = [
  {
    up: migration_20260623_182755_initial.up,
    down: migration_20260623_182755_initial.down,
    name: '20260623_182755_initial'
  },
];
