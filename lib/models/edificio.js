import { DataTypes, Model } from 'sequelize';

export default class Edificio extends Model {
  static init(sequelize) {
    return super.init(
      {
        nombre: DataTypes.STRING,
      },
      {
        sequelize,
        modelName: 'Edificio',
      }
    );
  }

  static associate(models) {
    this.myAssociation = this.hasMany(models.Espacio);
  }
}
