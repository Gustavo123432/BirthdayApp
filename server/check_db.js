require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')) {
    process.env.DATABASE_URL = process.env.DATABASE_URL.replace('localhost', '127.0.0.1');
    console.log('Patched DATABASE_URL to use 127.0.0.1');
}
const prisma = new PrismaClient();

async function main() {
    console.log('Prisma keys:', Object.keys(prisma));

    // Try accessing models with different casing or check if they exist
    if (!prisma.tag && !prisma.Tag) {
        console.error('Tag model not found on prisma client');
        return;
    }

    console.log('--- Tags ---');
    // Use dynamic access just in case
    const tagDelegate = prisma.tag || prisma.Tag;
    const tags = await tagDelegate.findMany({
        include: { emailTemplates: true }
    });
    console.log(JSON.stringify(tags, null, 2));

    console.log('\n--- Email Templates ---');
    const templateDelegate = prisma.emailTemplate || prisma.EmailTemplate;
    const templates = await templateDelegate.findMany({
        include: { tag: true, company: true }
    });
    console.log(JSON.stringify(templates, null, 2));

    console.log('\n--- Companies ---');
    const companies = await prisma.company.findMany();
    console.log(JSON.stringify(companies, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
