import Edificio from '../models/edificio';
import Espacio from '../models/espacio';
import app from '../app';
import { cleanDb } from '../../test/db_utils';
import request from 'supertest';

describe('Espacio controller', () => {
  beforeAll(async () => {
    await cleanDb();

    const edificios = await Edificio.bulkCreate(
      [
        { id: 1, nombre: 'Malvinas' },
        { id: 2, nombre: 'Origone B' },
      ],
      {
        returning: true,
      }
    );

    await Espacio.bulkCreate([
      {
        edificioId: edificios[0].id,
        piso: 1,
        nombre: 'Laboratorio 3',
        habilitado: false,
        aforo: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        edificioId: edificios[1].id,
        piso: 1,
        nombre: 'Biblioteca',
        habilitado: true,
        aforo: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  });

  describe('/espacios', () => {
    it('devuelve código 200', async () => {
      const response = await request(app).get('/api/espacios');
      expect(response.statusCode).toBe(200);
    });

    it('devuelve la lista de espacios', async () => {
      const response = await request(app).get('/api/espacios');
      expect(response.body).toMatchObject({
        data: [{ nombre: 'Laboratorio 3' }, { nombre: 'Biblioteca' }],
      });
    });
  });

  describe('/espacios/id', () => {
    describe('Cuando existe el espacio', () => {
      it('devuelve código 200', async () => {
        const response = await request(app).get('/api/espacios/2');
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
          data: { nombre: 'Biblioteca' },
        });
      });
    });

    describe('Cuando no existe el espacio', () => {
      it('devuelve código 404', async () => {
        const response = await request(app).get('/api/espacios/258');
        expect(response.statusCode).toBe(404);
      });
    });

    describe('Actualizar y verificar cambio de los datos', () => {
      it('actualizar', async () => {
        const response = await request(app).put('/api/espacios/2').send({
          edificioId: 2,
          piso: 0,
          nombre: 'Almacen de Material Didactico',
          habilitado: true,
          aforo: 77,
        });
        expect(response.statusCode).toBe(200);

        const get = await request(app).get('/api/espacios/2');
        expect(get.body).toMatchObject({
          data: {
            nombre: 'Almacen de Material Didactico',
          },
        });
      });
    });

    describe('Borrar y verificar que se eliminó', () => {
      it('borrar', async () => {
        const response = await request(app).del('/api/espacios/2');
        expect(response.statusCode).toBe(204);

        const get = await request(app).get('/api/espacios/2');
        expect(get.statusCode).toBe(404);
      });
    });
  });
});
