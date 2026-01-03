// FRONTEND/components/Organization.jsx
import React from "react";
import useApp from "../contexts/AppContext";
import TeamsIndex from "./Teams/Index";
import ProjectIndex from "./Projects/Index";
import InWorks from "./InWorks";

const OrganizationDashboard = () => {
    const { appState } = useApp();

    const { teams, projects, branches } = React.useMemo(() => ({
        teams: appState.modules?.find(m => m.title?.toLowerCase() === 'teams')?.enabled,
        projects: appState.modules?.find(m => m.title?.toLowerCase() === 'projects')?.enabled,
        branches: appState.modules?.find(m => m.title?.toLowerCase() === 'branches')?.enabled
    }), [appState]);

    return (
        <>
            {
                teams && <section className={'teams'}>
                    <TeamsIndex compact transparent/>
                </section>
            }
            {
                projects && <section className={'projects'}>
                    <ProjectIndex compact transparent/>
                </section>
            }
            {
                branches && <>
                    <section className={'branches'}>
                        <h1>Branches</h1>
                        <InWorks transparent icon={'hub'} hideReturnLink description={'Work in progress'}/>
                    </section>
                    <section className={'regions'}>
                        <h1>Regions</h1>
                        <InWorks transparent icon={'globe'} hideReturnLink description={'Work in progress'}/>
                    </section>
                </>
            }
            {
                !(teams || projects || branches) && <>
                    Currently all organization units including: Teams, Projects, Branches and Regions are disabled.<br/>
                    Reach out to your Admin to enable any organization-related app module if needed.
                </>
            }
        </>
    );
};

export default OrganizationDashboard;