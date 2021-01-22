import Edificio from '../models/edificio';
import app from '../app';
import { cleanDb } from '../../test/db_utils';
import { getToken } from '../../test/config_token';
import request from 'supertest';

describe('Edificio controller', () => {
  let token;

  beforeAll(async () => {
    await cleanDb();

    token = await getToken();

    await Edificio.bulkCreate([
      { nombre: 'Malvinas' },
      { nombre: 'Origone A' },
    ]);
  });

  describe('/edificios', () => {
    it('devuelve código 200', async () => {
      const response = await request(app)
        .get('/api/edificios')
        .set('Authorization', `Bearer ${token}`);
      expect(response.statusCode).toBe(200);
    });

    it('devuelve la lista de edificios', async () => {
      const response = await request(app)
        .get('/api/edificios')
        .set('Authorization', `Bearer ${token}`);
      expect(response.body).toMatchObject({
        data: [{ nombre: 'Malvinas' }, { nombre: 'Origone A' }],
      });
    });
  });

  describe('/edificios/id', () => {
    describe('Cuando existe el edificio', () => {
      it('devuelve código 200', async () => {
        const response = await request(app)
          .get('/api/edificios/1')
          .set('Authorization', `Bearer ${token}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
          data: { nombre: 'Malvinas' },
        });
      });
    });

    describe('Cuando el edificio no existe', () => {
      it('devuelve código 404', async () => {
        const response = await request(app)
          .get('/api/edificios/258')
          .set('Authorization', `Bearer ${token}`);
        expect(response.statusCode).toBe(404);
      });
    });

    describe('Actualizar y verificar cambio de los datos', () => {
      it('actualizar', async () => {
        const response = await request(app)
          .put('/api/edificios/1')
          .send({
            nombre: 'Malvinas Argentinas',
          })
          .set('Authorization', `Bearer ${token}`);
        expect(response.statusCode).toBe(200);

        const get = await request(app)
          .get('/api/edificios/1')
          .set('Authorization', `Bearer ${token}`);
        expect(get.body).toMatchObject({
          data: { nombre: 'Malvinas Argentinas' },
        });
      });
    });

    describe('Borrar y verificar que se eliminó', () => {
      it('borrar', async () => {
        const response = await request(app)
          .del('/api/edificios/1')
          .set('Authorization', `Bearer ${token}`);
        expect(response.statusCode).toBe(204);

        const get = await request(app)
          .get('/api/edificios/1')
          .set('Authorization', `Bearer ${token}`);
        expect(get.statusCode).toBe(404);
      });
    });
  });
});
