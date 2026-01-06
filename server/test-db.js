
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Testing database connection...');
    try {
        const count = await prisma.user.count();
        console.log('✅ Connection successful!');
        console.log(`Found ${count} users in the database.`);
    } catch (e) {
        console.error('❌ Connection failed!');
        console.error('Error message:', e.message);
        console.error('\nSUGESTÃO: Verifique o ficheiro .env e confirme se a "DATABASE_URL" tem a password correta.');
    } finally {
        await prisma.$disconnect();
    }
}

main();
