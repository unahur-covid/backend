import { compose, pathOr, prop, propEq, sortBy, toLower } from 'ramda';
import axios from 'axios';
import { guaraniApiUrl } from '../config/auth';
import { rollbar } from '../config/rollbar';
import { conCache } from './cache';
import { find } from 'ramda';

const makeApi = () => axios.create({ baseURL: guaraniApiUrl });

const notificarError = (endpoint, error) => {
  const statusCode = pathOr(
    'desconocido',
    ['response', 'data', 'status'],
    error
  );
  rollbar.error(
    `Guaraní - falló request a ${endpoint} con error ${statusCode}`,
    { error }
  );
};

export const inscripcionesPara = async (dni) => {
  try {
    const response = await makeApi().get(`/inscripciones/${dni}`);
    return response.data.carreras;
  } catch (error) {
    if (error.response.data.status === 404) {
      return [];
    } else {
      notificarError('/inscripciones', error);
      return null;
    }
  }
};

export const getCarrera = async (idCarrera) => {
  const carreras = await getCarreras();
  return find(propEq('id', idCarrera), carreras);
};

export const getCarreras = conCache('carrerasGuarani', async () => {
  try {
    const response = await makeApi().get(`/carreras`);
    return sortBy(compose(toLower, prop('nombre')), response.data);
  } catch (error) {
    notificarError('/carreras', error);
    return [];
  }
});
