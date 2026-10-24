import { RefreshToken } from '../auth/refresh-token.entity.js';
import { CarLog } from '../modules/cars/car-log.entity.js';
import { Car } from '../modules/cars/car.entity.js';
import { CostItem } from '../modules/cars/cost-item.entity.js';
import { Client } from '../modules/clients/client.entity.js';
import { Vehicle } from '../modules/clients/vehicle.entity.js';
import { StoredFile } from '../modules/files/stored-file.entity.js';
import { HelperPayment } from '../modules/helpers/helper-payment.entity.js';
import { Helper } from '../modules/helpers/helper.entity.js';
import { Shop } from '../modules/shops/shop.entity.js';
import { User } from '../modules/users/user.entity.js';

export const entities = [
  Shop,
  User,
  Helper,
  Client,
  Vehicle,
  Car,
  CostItem,
  CarLog,
  StoredFile,
  HelperPayment,
  RefreshToken,
];
