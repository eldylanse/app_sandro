import test from 'node:test';
import assert from 'node:assert/strict';
import User from '../src/models/user.model.js';
import { createAdminUser } from '../src/config/initialSetup.js';

const config = {
  ADMIN_NAME: 'Sandro Entrenador',
  ADMIN_EMAIL: 'sandro@example.com',
  ADMIN_PHONE: '+56987654321',
  ADMIN_PASSWORD: 'clave-de-prueba-larga',
};

test('fresh database requires private administrator settings', async () => {
  const findOne = User.findOne;
  User.findOne = async () => null;
  try {
    await assert.rejects(createAdminUser({}), /ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, ADMIN_PASSWORD/);
  } finally {
    User.findOne = findOne;
  }
});

test('fresh database creates administrator from settings', async () => {
  const original = { findOne: User.findOne, encryptPassword: User.encryptPassword, save: User.prototype.save };
  let saved;
  User.findOne = async () => null;
  User.encryptPassword = async () => 'hashed-password';
  User.prototype.save = async function () { saved = this; return this; };
  try {
    await createAdminUser(config);
    assert.equal(saved.nombre, config.ADMIN_NAME);
    assert.equal(saved.email, config.ADMIN_EMAIL);
    assert.equal(saved.celular, config.ADMIN_PHONE);
    assert.equal(saved.role, 'admin');
    assert.equal(saved.password, 'hashed-password');
  } finally {
    User.findOne = original.findOne;
    User.encryptPassword = original.encryptPassword;
    User.prototype.save = original.save;
  }
});

test('legacy default administrator is rotated and old sessions are revoked', async () => {
  const original = { findOne: User.findOne, comparePassword: User.comparePassword, encryptPassword: User.encryptPassword };
  const admin = {
    email: 'admin@email.com',
    password: 'legacy-hash',
    tokenVersion: 0,
    saved: false,
    async save() { this.saved = true; },
  };
  User.findOne = async () => admin;
  User.comparePassword = async () => true;
  User.encryptPassword = async () => 'new-hash';
  try {
    await createAdminUser(config);
    assert.equal(admin.email, config.ADMIN_EMAIL);
    assert.equal(admin.password, 'new-hash');
    assert.equal(admin.tokenVersion, 1);
    assert.equal(admin.saved, true);
  } finally {
    User.findOne = original.findOne;
    User.comparePassword = original.comparePassword;
    User.encryptPassword = original.encryptPassword;
  }
});

test('an existing administrator with a changed password is left untouched', async () => {
  const original = { findOne: User.findOne, comparePassword: User.comparePassword };
  const admin = { email: 'admin@email.com', password: 'changed-hash', saved: false, async save() { this.saved = true; } };
  User.findOne = async () => admin;
  User.comparePassword = async () => false;
  try {
    await createAdminUser({});
    assert.equal(admin.saved, false);
    assert.equal(admin.password, 'changed-hash');
  } finally {
    User.findOne = original.findOne;
    User.comparePassword = original.comparePassword;
  }
});
