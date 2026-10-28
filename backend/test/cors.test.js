import test from 'node:test';
import assert from 'node:assert/strict';
import { getAllowedOrigins } from '../src/config/cors.js';

test('development defaults to the local frontend', () => {
  assert.deepEqual(getAllowedOrigins('', 'development'), ['http://localhost:5173']);
});

test('production requires explicit exact origins', () => {
  assert.throws(() => getAllowedOrigins('', 'production'), /Configura CORS_ALLOWED_ORIGINS/);
  assert.deepEqual(
    getAllowedOrigins('https://tribufit.example, https://preview.example', 'production'),
    ['https://tribufit.example', 'https://preview.example'],
  );
  assert.throws(() => getAllowedOrigins('*', 'production'), /orígenes http\(s\)/);
  assert.throws(() => getAllowedOrigins('https://tribufit.example/path', 'production'), /sin rutas/);
});
