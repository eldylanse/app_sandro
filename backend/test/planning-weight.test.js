import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Planning from '../src/models/planning.model.js';
import { createPlanningService } from '../src/services/planning.service.js';

function planningData(exercise) {
  return {
    id_cliente: new mongoose.Types.ObjectId(),
    nombre: 'Plan de prueba',
    objetivo: 'Fuerza',
    fecha_inicio: new Date('2026-11-01'),
    fecha_termino: new Date('2026-11-30'),
    microciclos: [{
      numero_semana: 1,
      dias_entrenamiento: [{
        fecha: new Date('2026-11-02'),
        ejercicios: [{
          id_ejercicio: new mongoose.Types.ObjectId(),
          series_planificadas: 3,
          tipo_objetivo: 'repeticiones',
          repeticiones_planificadas: '8-12',
          ...exercise,
        }],
      }],
    }],
  };
}

test('planned weight remains optional and preserves a positive kilogram value', async () => {
  const withoutWeight = new Planning(planningData({}));
  await withoutWeight.validate();
  assert.equal(withoutWeight.microciclos[0].dias_entrenamiento[0].ejercicios[0].peso_planificado, null);

  const withWeight = new Planning(planningData({ peso_planificado: 12.5 }));
  await withWeight.validate();
  assert.equal(withWeight.toObject().microciclos[0].dias_entrenamiento[0].ejercicios[0].peso_planificado, 12.5);
});

test('invalid planned weight is rejected before a planning is saved', async () => {
  await assert.rejects(createPlanningService(planningData({ peso_planificado: -2 })), /mayor que cero/);
  await assert.rejects(createPlanningService(planningData({ peso_planificado: 'no es un número' })), /mayor que cero/);
});
