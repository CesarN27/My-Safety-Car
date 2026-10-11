import { CarLog } from '../modules/cars/car-log.entity.js';
import { CarPhoto } from '../modules/cars/car-photo.entity.js';
import { Car } from '../modules/cars/car.entity.js';
import { CostItem } from '../modules/cars/cost-item.entity.js';
import { Helper } from '../modules/helpers/helper.entity.js';
import { Shop } from '../modules/shops/shop.entity.js';
import { User } from '../modules/users/user.entity.js';

export const entities = [Shop, User, Helper, Car, CostItem, CarLog, CarPhoto];
