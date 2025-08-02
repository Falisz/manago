//BACKEND/controller/pages.js
const {UserConfigs, AppPage, sequelize} = require("../db");

async function getPages(user) {
    let userConfigs;

    try {
        userConfigs = await UserConfigs.findOne({ where: { user: user.ID } });
    } catch (err) {
        userConfigs = {};
    }

    const view = (userConfigs?.manager_view_enabled || false) ? 1 : 0;


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
            ...(row?.parent ? {} : { subpages: [] })
        };

        if (!row?.parent) {
            pageMap.set(row?.ID, page);
            pages.push(page);
        } else {
            const parent = pageMap.get(row.parent);
            if (parent) {
                parent.subpages.push({
                    path: row.path,
                    title: row.title,
                    component: row.component,
                    hidden: row?.hidden,
                });
            }
        }
    }

    return pages;
}

module.exports = {
    getPages,
};