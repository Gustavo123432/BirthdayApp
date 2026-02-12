const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const username = process.argv[2];

    if (!username) {
        console.log('Usage: node promote_admin.js <username>');
        process.exit(1);
    }

    try {
        const user = await prisma.user.update({
            where: { username: username },
            data: { role: 'ADMIN' }
        });
        console.log(`User ${user.username} is now an ADMIN.`);
    } catch (e) {
        console.error(`Error: ${e.message}`);
    } finally {
        await prisma.$disconnect();
    }
}

main();
