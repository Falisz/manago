import componentMap from "../Components";
import axios from "axios";
import NotFound from "../components/NotFound";

const FetchPages = async () => {
    const result = await axios.get('/pages', {withCredentials: true});

    if (Array.isArray(result.data)) {

        return result.data.map((page) => ({
            ...page,
            ...(page.component ? {component: componentMap[page.component] || NotFound} : {}),
            subpages: page.subpages.map((subpage) => ({
                ...subpage,
                ...(subpage.component ? {component: componentMap[subpage.component] || NotFound} : {}),
                subpages: subpage.subpages.map((subsubpage) => ({
                    ...subsubpage,
                    ...(subsubpage.component ? {component: componentMap[subsubpage.component] || NotFound} : {}),
                    subpages: [],
                })),
            })),
        }));

    } else {

        return [];

    }
};

export default FetchPages;