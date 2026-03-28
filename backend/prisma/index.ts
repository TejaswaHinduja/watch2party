import 'dotenv/config'
import { PrismaClient } from '../../generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const adapter = new PrismaNeon({
  connectionString: process.env.DB_URL_NEON!,
})

export const prisma = new PrismaClient({ adapter })