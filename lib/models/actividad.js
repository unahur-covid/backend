import { DataTypes, Model } from 'sequelize';
import { getFinDelDia, getInicioDelDia } from '../utils/dateUtils';

import Turno from './turno';
import Edificio from './edificio';
import Espacio from './espacio';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize';
import { isNil } from 'ramda';

export default class Actividad extends Model {
  static init(sequelize) {
    return super.init(
      {
        nombre: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        fechaHoraInicio: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        fechaHoraFin: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        responsable: {
          type: DataTypes.STRING,
        },
        telefonoDeContactoResponsable: {
          type: DataTypes.STRING,
        },
        activa: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        requiereControl: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        restriccionId: {
          type: DataTypes.INTEGER,
        },
      },
      {
        sequelize,
        modelName: 'Actividad',
        tableName: 'Actividades',
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Espacio, { foreignKey: 'espacioId' });
    this.hasMany(models.Turno, { foreignKey: 'actividadId' });
  }

  static conAutorizaciones({ desde, hasta, idsCarreras, inactivas } = {}) {
    return this.findAll({
      attributes: {
        include: [
          // Sequelize trata al COUNT como un string, por eso hacemos un casteo a integer.
          // Ver https://github.com/sequelize/sequelize/issues/2383
          [Sequelize.literal('COUNT("Turnos".id)::integer'), 'turnos'],
        ],
      },
      include: [
        {
          model: Espacio,
          attributes: ['id', 'nombre', 'aforo'],
          include: {
            model: Edificio,
            attributes: ['id', 'nombre'],
          },
        },
        {
          model: Turno,
          attributes: [],
          required: false,
        },
      ],
      order: [
        ['fechaHoraInicio', 'ASC'],
        ['nombre', 'ASC'],
      ],
      group: ['Actividad.id', 'Espacio.id', 'Espacio.Edificio.id'],
      where: {
        [Op.and]: [
          this.getFiltroFecha(desde, hasta),
          this.getFiltroCarreras(idsCarreras),
          this.getFiltroInactivas(inactivas),
        ],
      },
    });
  }

  static getFiltroFecha(desde, hasta) {
    if (desde !== undefined && hasta !== undefined) {
      return {
        fechaHoraInicio: {
          [Op.between]: [getInicioDelDia(desde), getFinDelDia(hasta)],
        },
      };
    }

    if (desde !== undefined) {
      return { fechaHoraInicio: { [Op.gte]: getInicioDelDia(desde) } };
    }

    if (hasta !== undefined) {
      return { fechaHoraInicio: { [Op.lte]: getFinDelDia(hasta) } };
    }

    return {};
  }

  static getFiltroCarreras(idsCarreras) {
    if (idsCarreras !== undefined) {
      return {
        restriccionId: {
          [Op.or]: {
            [Op.in]: idsCarreras,
            [Op.eq]: null,
          },
        },
      };
    }
    return {};
  }

  static getFiltroInactivas(inactivas) {
    return inactivas ? {} : { activa: true };
  }

  esPublica() {
    return isNil(this.restriccionId);
  }
}
