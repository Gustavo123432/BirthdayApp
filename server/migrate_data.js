const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting data migration...');

    // 1. Check if default company exists
    let company = await prisma.company.findFirst({
        where: { name: 'EPVC' }
    });

    if (!company) {
        console.log('Creating default company "EPVC"...');
        company = await prisma.company.create({
            data: { name: 'EPVC' }
        });
    } else {
        console.log('Default company "EPVC" already exists.');
    }

    // 2. Link existing People
    const peopleCount = await prisma.person.count({
        where: { companyId: null }
    });
    if (peopleCount > 0) {
        console.log(`Linking ${peopleCount} people to "EPVC"...`);
        await prisma.person.updateMany({
            where: { companyId: null },
            data: { companyId: company.id }
        });
    }

    // 3. Link existing Config
    const config = await prisma.config.findFirst({
        where: { companyId: null }
    });
    if (config) {
        console.log('Linking existing configuration to "EPVC"...');
        await prisma.config.update({
            where: { id: config.id },
            data: { companyId: company.id }
        });
    }

    // 4. Link existing Users
    const users = await prisma.user.findMany({
        include: { companies: true }
    });

    for (const user of users) {
        const isLinked = user.companies.some(c => c.id === company.id);
        if (!isLinked) {
            console.log(`Linking user ${user.username} to "EPVC"...`);
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    companies: {
                        connect: { id: company.id }
                    }
                }
            });
        }
    }

    console.log('Migration complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
