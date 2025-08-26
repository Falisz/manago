//BACKEND/controllers/pages.js
import sequelize from '../db.js';
import AppPage from '../models/app-page.js';

/**
 * Retrieves pages for a user based on their manager view configuration.
 * @param {number} view - 0 for Staff View and 1 for Manager View.
 * @returns {Promise<Object[]>} Array of page objects with nested subpages
 */
export async function getPages(view = 0) {

    const pages = [];

    const pageMap = new Map();

    const rows = await AppPage.findAll({
        where: { view: view },
        order: [
            sequelize.literal('CASE WHEN "parent" IS NULL THEN 0 ELSE 1 END'),
            ['parent', 'ASC'],
            ['ID', 'ASC']
        ]
    });

    for (const row of rows) {
        const page = {
            path: row?.path,
            title: row?.title,
            icon: row?.icon,
            hidden: row?.hidden,
            ...(row?.component ? { component: row.component } : {}),
            subpages: []
        };

        pageMap.set(row.ID, page);

        if (!row?.parent) {
            pages.push(page);
        }
    }

    for (const row of rows) {
        if (row?.parent) {
            const parent = pageMap.get(row.parent);
            if (parent) {
                const childPage = pageMap.get(row.ID);
                parent.subpages.push(childPage);
            }
        }
    }

    return pages;
}