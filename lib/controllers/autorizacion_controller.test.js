import Actividad from '../models/actividad';
import Autorizacion from '../models/autorizacion';
import Edificio from '../models/edificio';
import Espacio from '../models/espacio';
import Usuario from '../models/usuario';
import app from '../app';
import { cleanDb } from '../../test/db_utils';
import { getToken } from '../../test/config_token';
import request from 'supertest';

describe('Autorización controller', () => {
  let token;

  beforeAll(async () => {
    await cleanDb();

    token = await getToken();

    const edificios = await Edificio.bulkCreate(
      [{ nombre: 'Malvinas' }, { nombre: 'Origone B' }],
      {
        returning: true,
      }
    );

    const espacios = await Espacio.bulkCreate(
      [
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
      ],
      {
        returning: true,
      }
    );

    const actividades = await Actividad.bulkCreate([
      {
        espacioId: espacios[0].id,
        nombre: 'Clase de laboratorio',
        fechaHoraInicio: new Date(),
        fechaHoraFin: new Date(),
        responsable: 'Mariela Tocino',
        dniResponsable: 18765234,
        tipoResponsable: 'Docente',
        estado: true,
        requiereControl: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        espacioId: espacios[1].id,
        nombre: 'Lectura grupal',
        fechaHoraInicio: new Date(),
        fechaHoraFin: new Date(),
        responsable: 'Marcela Peperoni',
        dniResponsable: 30234789,
        tipoResponsable: 'No docente',
        estado: true,
        requiereControl: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const usuario = await Usuario.create({
      nombre: 'Usuario',
      apellido: 'Prueba',
      contrasenia: '1234',
      dni: 2,
      telefono: 1,
      email: 'usuario_2@gmail.com',
      rol: 'invitado',
    });

    await Autorizacion.bulkCreate([
      {
        usuarioId: usuario.id,
        actividadId: actividades[0].id,
        estuvoEnContacto: false,
      },
      {
        usuarioId: usuario.id,
        actividadId: actividades[1].id,
        estuvoEnContacto: true,
      },
    ]);
  });

  describe('/autorizaciones', () => {
    it('devuelve código 200', async () => {
      const response = await request(app)
        .get('/api/autorizaciones')
        .set('Authorization', `Bearer ${token}`);
      expect(response.statusCode).toBe(200);
    });

    it('devuelve la lista de autorizaciones', async () => {
      const response = await request(app)
        .get('/api/autorizaciones')
        .set('Authorization', `Bearer ${token}`);
      expect(response.body).toMatchObject({
        data: [
          {
            usuarioId: 2,
            estuvoEnContacto: false,
          },
          {
            usuarioId: 2,
            estuvoEnContacto: true,
          },
        ],
      });
    });

    it('crea una autorizacion', async () => {
      const response = await request(app)
        .post('/api/autorizaciones')
        .send({
          usuarioId: 2,
          actividadId: 1,
          estuvoEnContacto: true,
        })
        .set('Authorization', `Bearer ${token}`);
      expect(response.statusCode).toBe(201);

      const get = await request(app)
        .get('/api/autorizaciones/3')
        .set('Authorization', `Bearer ${token}`);
      expect(get.body).toMatchObject({
        data: {
          usuarioId: 2,
          actividadId: 1,
          estuvoEnContacto: true,
        },
      });
    });
  });

  describe('/autorizaciones/id', () => {
    describe('Cuando existe la autorización', () => {
      it('devuelve código 200', async () => {
        const response = await request(app)
          .get('/api/autorizaciones/2')
          .set('Authorization', `Bearer ${token}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
          data: {
            usuarioId: 2,
            estuvoEnContacto: true,
          },
        });
      });
    });

    describe('Cuando no existe la autorización', () => {
      it('devuelve código 404', async () => {
        const response = await request(app)
          .get('/api/autorizaciones/10')
          .set('Authorization', `Bearer ${token}`);
        expect(response.statusCode).toBe(404);
      });
    });

    describe('Actualizar y verificar cambio de los datos', () => {
      it('actualizar', async () => {
        const response = await request(app)
          .put('/api/autorizaciones/2')
          .send({
            usuarioId: 2,
            actividadId: 2,
            estuvoEnContacto: false,
          })
          .set('Authorization', `Bearer ${token}`);
        expect(response.statusCode).toBe(200);

        const get = await request(app)
          .get('/api/autorizaciones/2')
          .set('Authorization', `Bearer ${token}`);
        expect(get.body).toMatchObject({
          data: {
            usuarioId: 2,
            actividadId: 2,
            estuvoEnContacto: false,
          },
        });
      });
    });

    describe('Borrar y verificar que se eliminó', () => {
      it('borrar', async () => {
        const response = await request(app)
          .del('/api/autorizaciones/1')
          .set('Authorization', `Bearer ${token}`);
        expect(response.statusCode).toBe(204);

        const get = await request(app)
          .get('/api/autorizaciones/1')
          .set('Authorization', `Bearer ${token}`);
        expect(get.statusCode).toBe(404);
      });
    });

    describe('Borrar cuando no existe la autorización', () => {
      it('borrar', async () => {
        const response = await request(app)
          .del('/api/autorizaciones/7')
          .set('Authorization', `Bearer ${token}`);
        expect(response.statusCode).toBe(404);
      });
    });
  });
});