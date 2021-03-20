import * as HTMLUtils from '../utils/html_utils';
import * as MailSender from '../helpers/mail_sender';

import { DataTypes, Model } from 'sequelize';
import { asuntoRecuperarContrasenia, host } from '../config/mail_sender';
import { concat, isEmpty, map, omit, pluck, prop } from 'ramda';

import Actividad from './actividad';
import Edificio from './edificio';
import Espacio from './espacio';
import bcrypt from 'bcryptjs';
import { generarJWT } from '../helpers/jwt';

export default class Usuario extends Model {
  static init(sequelize) {
    return super.init(
      {
        nombre: {
          allowNull: false,
          type: DataTypes.STRING,
        },
        apellido: {
          allowNull: false,
          type: DataTypes.STRING,
        },
        contrasenia: {
          allowNull: false,
          type: DataTypes.STRING,
        },
        dni: {
          allowNull: false,
          type: DataTypes.NUMBER,
          unique: {
            msg: 'El DNI ya está en uso, por favor utilice otro.',
          },
        },
        telefono: {
          allowNull: false,
          type: DataTypes.STRING,
        },
        email: {
          allowNull: false,
          type: DataTypes.STRING,
          unique: { msg: 'El email ya está en uso, por favor utilice otro.' },
          validate: {
            isEmail: { msg: 'El formato de email es incorrecto' },
          },
        },
        rol: {
          allowNull: false,
          type: DataTypes.ENUM('asistente', 'bedel', 'admin'),
          defaultValue: 'asistente',
        },
        fechaSincronizacionGuarani: {
          type: DataTypes.DATE,
          defaultValue: null,
        },
      },
      {
        sequelize,
        modelName: 'Usuario',
        hooks: {
          beforeCreate: (usuario) => {
            usuario.contrasenia = bcrypt.hashSync(
              usuario.contrasenia,
              bcrypt.genSaltSync()
            );
          },
        },
      }
    );
  }

  static associate(models) {
    this.hasMany(models.Turno, { foreignKey: 'usuarioId' });
    this.hasMany(models.InscripcionCarrera, { foreignKey: 'usuarioId' });
  }

  validarContrasenia(contraseniaAValidar) {
    return bcrypt.compareSync(contraseniaAValidar, this.contrasenia);
  }

  toJSON() {
    return omit(['contrasenia'], super.toJSON());
  }

  async getTurnosConInfoActividades() {
    return this.getTurnos({
      include: [
        {
          model: Actividad,
          attributes: [
            'id',
            'nombre',
            'fechaHoraInicio',
            'fechaHoraFin',
            'responsable',
          ],
          include: [
            {
              model: Espacio,
              attributes: ['nombre'],
              include: [
                {
                  model: Edificio,
                  attributes: ['nombre'],
                },
              ],
            },
          ],
        },
      ],
    });
  }

  async getIdsCarreras() {
    const inscripciones = await this.getInscripcionCarreras({
      attributes: ['idCarrera'],
      raw: true,
    });

    return pluck(['idCarrera'], inscripciones);
  }

  async getIdsActividadesConTurno() {
    const ids = await this.getTurnos({
      attributes: [],
      include: {
        model: Actividad,
        attributes: ['id'],
      },
      raw: true,
    });

    // Al usar raw, Sequelize ni se molesta en crear objetos anidados:
    // directamente le pone los puntos en el nombre del atributo.
    return map(prop('Actividad.id'), ids);
  }

  async puedePedirTurnoPara(actividad) {
    return (
      actividad.esPublica() ||
      (await this.estaInscriptoA(actividad.restriccionId))
    );
  }

  async estaInscriptoA(carreraId) {
    const inscripciones = await this.getInscripcionCarreras({
      where: { idCarrera: carreraId },
    });

    return !isEmpty(inscripciones);
  }

  async solicitoTurnoPara(actividad) {
    const turnos = await this.getTurnos({
      where: {
        actividadId: actividad.id,
      },
      attributes: ['id'],
      raw: true,
    });

    return !isEmpty(turnos);
  }

  async recuperarContrasenia() {
    const token = generarJWT(this.id, this.dni, '15m');

    const templateRecuperarContrasenia = await HTMLUtils.getHTMLFile(
      'lib/html/templateRecuperarContrasenia.html',
      {
        nombreUsuario: this.nombre,
        linkTemporal: concat(host, `/recuperar?token=${token}&dni=${this.dni}`),
      }
    );

    await MailSender.sendMail(
      this.email,
      asuntoRecuperarContrasenia,
      templateRecuperarContrasenia
    );
  }

  async actualizarContrasenia(contrasenia) {
    contrasenia = bcrypt.hashSync(contrasenia, bcrypt.genSaltSync());
    this.update({ contrasenia });
  }

  puedeBorrar(turno) {
    return this.esAdmin() || turno.usuarioId == this.id;
  }

  esAdmin() {
    return this.rol == 'admin';
  }
}
