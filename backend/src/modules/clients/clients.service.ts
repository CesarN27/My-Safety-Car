import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Client } from './client.entity.js';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client) private readonly clients: Repository<Client>,
  ) {}

  /**
   * Liga a la cuenta todos los clientes (de cualquier taller) capturados con ese teléfono.
   * Solo se llama después de verificar el teléfono con el código, así que quien entra es
   * de verdad el dueño del número. No pisa clientes que ya tienen cuenta.
   */
  async linkAccount(userId: string, phone: string) {
    await this.clients.update({ phone, userId: IsNull() }, { userId });
  }
}
