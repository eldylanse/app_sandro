import test from 'node:test';
import assert from 'node:assert/strict';
import User from '../src/models/user.model.js';
import { changeClientPasswordService, resetClientPasswordService } from '../src/services/user.service.js';

const original = {
  findOne: User.findOne,
  comparePassword: User.comparePassword,
  encryptPassword: User.encryptPassword,
};

function mockClient() {
  return {
    role: 'cliente',
    password: 'hash:old-password',
    tokenVersion: 0,
    saved: false,
    async save() { this.saved = true; },
  };
}

test('client password change requires the old password and revokes existing tokens', async () => {
  const client = mockClient();
  User.findOne = async () => client;
  User.comparePassword = async (plain, hash) => hash === `hash:${plain}`;
  User.encryptPassword = async (plain) => `hash:${plain}`;
  try {
    await assert.rejects(changeClientPasswordService('client-id', 'wrong', 'new-password'), /actual es incorrecta/);
    assert.equal(client.saved, false);
    await assert.rejects(changeClientPasswordService('client-id', 'old-password', 'old-password'), /diferente/);
    assert.equal(client.saved, false);
    await changeClientPasswordService('client-id', 'old-password', 'new-password');
    assert.equal(client.password, 'hash:new-password');
    assert.equal(client.tokenVersion, 1);
    assert.equal(client.saved, true);
  } finally {
    Object.assign(User, original);
  }
});

test('admin reset validates password and targets a client account only', async () => {
  const client = mockClient();
  User.findOne = async (query) => query.role === 'cliente' ? client : null;
  User.encryptPassword = async (plain) => `hash:${plain}`;
  try {
    await assert.rejects(resetClientPasswordService('client-id', 'short'), /entre 6 y 128/);
    assert.equal(client.saved, false);
    await resetClientPasswordService('client-id', 'new-password');
    assert.equal(client.password, 'hash:new-password');
    assert.equal(client.tokenVersion, 1);
  } finally {
    Object.assign(User, original);
  }
});
