import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prismaClient = new PrismaClient();

const createClient = async () => {
  const clientsToCreate = 10;

  for (let i = 0; i < clientsToCreate; i++) {
    const client: Partial<Client> = {
      name: 'Nome do Cliente ' + i,
      email: `cliente${i}@exemplo.com`,
      cpf_hash: 'hashCPF' + i,
      password_hash: await bcrypt.hash('senhaDoCliente' + i, 6),
      city: 'Cidade ' + i,
      state: 'Estado ' + i,
      zip_code: 'CEP' + i,
      phone: 'Telefone ' + i,
    };

    const createdClient = await prismaClient.client.create({
      data: {
        name: client.name,
        email: client.email,
        cpf_hash: client.cpf_hash,
        password_hash: client.password_hash,
        city: client.city,
        state: client.state,
        zip_code: client.zip_code,
        phone: client.phone,
      },
    });

    console.log('Cliente criado:', createdClient);
  }

  await prismaClient.$disconnect();
};

createClient();

// Tipo do Cliente
type Client = {
  id?: string;
  name: string;
  email: string;
  cpf_hash: string;
  password_hash: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  created_at?: Date;
};
