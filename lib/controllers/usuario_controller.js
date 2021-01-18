import Usuario from '../models/usuario';
import passport from 'passport';

export const index = async (req, res) => {
  const data = await Usuario.findAll({});
  res.send({ data });
};

export const registro = async (req, res, next) => {
  passport.authenticate('registro', (err, data) => {
    if (err) {
      return res.status(400).json(err);
    }
    return res.status(201).json({ data });
  })(req, res, next);
};

export const login = async (req, res, next) => {
  passport.authenticate('login', (err, data) => {
    if (err) {
      return res.status(400).json(err);
    }
    return res.status(200).json({ uid: data.id });
  })(req, res, next);
};
