const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const deleted = await prisma.user.deleteMany({});
        console.log(`Deleted ${deleted.count} users.`);
        console.log('You can now refresh the page to create a new admin account.');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
