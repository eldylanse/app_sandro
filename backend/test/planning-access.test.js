import test from 'node:test';
import assert from 'node:assert/strict';
import Planning from '../src/models/planning.model.js';
import { getPlanningByIdService } from '../src/services/planning.service.js';

const planningId = 'planning-id';
const ownerId = 'client-owner';
const otherClientId = 'other-client';

function queryResult(value) {
  return {
    populate() { return this; },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
  };
}

test('a client can read only their own planning by ID while admin can read it', async () => {
  const original = Planning.findOne;
  const queries = [];
  const planning = { _id: planningId, id_cliente: ownerId };
  Planning.findOne = (query) => {
    queries.push(query);
    return queryResult(query.id_cliente && query.id_cliente !== ownerId ? null : planning);
  };
  try {
    assert.equal(await getPlanningByIdService(planningId, ownerId, 'cliente'), planning);
    await assert.rejects(getPlanningByIdService(planningId, otherClientId, 'cliente'), /Planificación no encontrada/);
    assert.equal(await getPlanningByIdService(planningId, 'admin-id', 'admin'), planning);
    assert.deepEqual(queries, [
      { _id: planningId, id_cliente: ownerId },
      { _id: planningId, id_cliente: otherClientId },
      { _id: planningId },
    ]);
  } finally {
    Planning.findOne = original;
  }
});

