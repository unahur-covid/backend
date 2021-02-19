import Actividad from '../models/actividad';
import Autorizacion from '../models/autorizacion';
import Edificio from '../models/edificio';
import Espacio from '../models/espacio';
import Usuario from '../models/usuario';
import { getCarrera } from '../helpers/api_guarani';

export const index = async (req, res) => {
  const { desde, hasta, inactivas } = req.query;
  const data = await Actividad.conAutorizaciones({ desde, hasta, inactivas });
  res.send({ data });
};

export const getById = async (req, res) => {
  const { id } = req.params;
  const data = await Actividad.findByPk(id, {
    include: {
      model: Espacio,
      attributes: ['id', 'nombre', 'aforo'],
      include: {
        model: Edificio,
        attributes: ['id', 'nombre'],
      },
    },
  });

  if (!data) {
    return res
      .status(404)
      .send({ error: `No existe una actividad con el id ${id}` });
  }
  res.send({ data });
};

export const create = async (req, res) => {
  const actividad = req.body;
  const { espacioId, restriccionId } = actividad;

  const espacio = await Espacio.findByPk(espacioId);
  if (!espacio) {
    return res.status(400).send({
      error: `No existe un espacio con el id ${espacioId}`,
    });
  }

  if (restriccionId) {
    const carrera = await getCarrera(restriccionId);
    if (!carrera) {
      return res.status(400).send({
        error: `No existe una carrera con el id ${restriccionId}`,
      });
    }
  }

  const data = await Actividad.create(actividad);
  res.status(201).send({ data });
};

export const update = async (req, res) => {
  const { id } = req.params;
  const actividad = await Actividad.findByPk(id);

  if (!actividad) {
    return res
      .status(404)
      .send({ error: `No existe una actividad con el id ${id}` });
  }

  const { espacioId } = req.body;
  const espacio = await Espacio.findByPk(espacioId);
  if (!espacio) {
    return res.status(400).send({
      error: `No existe un espacio con el id ${espacioId}`,
    });
  }

  const data = await Actividad.update(req.body, {
    where: { id: id },
    returning: true,
    plain: true,
  });

  res.status(200).send({ data });
};

export const deleteById = async (req, res) => {
  const { id } = req.params;
  const data = await Actividad.destroy({
    where: {
      id: id,
    },
  });

  if (!data) {
    return res
      .status(404)
      .send({ error: `No existe una actividad con el id ${id}` });
  }
  res.sendStatus(204);
};

export const getAutorizaciones = async (req, res) => {
  const { id } = req.params;

  const actividad = await Actividad.findByPk(id);

  if (!actividad) {
    return res
      .status(404)
      .send({ error: `No existe una actividad con el id ${id}` });
  }

  const data = await Autorizacion.findAll({
    where: {
      actividadId: id,
    },
    include: [
      {
        model: Usuario,
        attributes: ['id', 'nombre', 'apellido', 'dni'],
      },
    ],
    order: [[Usuario, 'apellido']],
  });

  res.send({ data });
};
