const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const startId = 1;
    const endId = 391;
    const tagId = 2; // Tag "Aluno"

    console.log(`Assigning Tag ID ${tagId} to People IDs ${startId}-${endId}...`);

    let successCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;

    for (let id = startId; id <= endId; id++) {
        try {
            await prisma.person.update({
                where: { id: id },
                data: {
                    tags: {
                        connect: { id: tagId }
                    }
                }
            });
            // process.stdout.write('.');
            successCount++;
        } catch (e) {
            if (e.code === 'P2025' || e.code === 'P2016') {
                // Record to update not found
                // process.stdout.write('x');
                notFoundCount++;
            } else {
                console.error(`\nError updating ID ${id}: ${e.message}`);
                errorCount++;
            }
        }

        // Progress update every 50
        if (id % 50 === 0) {
            console.log(`Processed up to ID ${id}...`);
        }
    }

    console.log('\n--- Summary ---');
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Skipped (not found): ${notFoundCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('----------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
