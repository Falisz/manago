// FRONTEND/components/Organization.jsx
import React, {useEffect} from "react";
import useApp from "../contexts/AppContext";
import InWorks from "./InWorks";
import {useProjects, useTeams} from "../hooks/useResource";
import Loader from "./Loader";
import {Link} from "react-router-dom";

const OrganizationIndex = () => {
    const { appState, refreshTriggers, user } = useApp();
    const { teams, loading: teamLoading, fetchTeams } = useTeams();
    const { projects, loading: projectsLoading, fetchProjects } = useProjects();

    useEffect(() => {
        const refresh = refreshTriggers?.teams || refreshTriggers?.projects || false;

        if (refresh) {
            delete refreshTriggers.teams;
            delete refreshTriggers.projects;
        }

        if (!teams || refresh)
            fetchTeams({all: true, user: user.id, loading: true}).then();

        if (!projects || refresh) fetchProjects({user: user.id}).then();

    }, [fetchTeams, teams, refreshTriggers.teams]);

    const { teamsM, projectsM, branchesM } = React.useMemo(() => ({
        teamsM: appState.modules?.find(m => m.title?.toLowerCase() === 'teams')?.enabled,
        projectsM: appState.modules?.find(m => m.title?.toLowerCase() === 'projects')?.enabled,
        branchesM: appState.modules?.find(m => m.title?.toLowerCase() === 'branches')?.enabled
    }), [appState]);

    const displaySeeAllTeamsButton = true;
    const displaySeeAllProjectsButton = true;

    return (
        <>
            <div className={'column left'}>
                <section className={'your-manager'}>
                    <h1>Your Managers</h1>
                    <div className={'list'}>
                        {
                            (user?.managers?.length && user.managers.map((mgr, i) =>
                                <div key={i}>{mgr.first_name} {mgr.last_name}</div>
                            )) || <div className={'empty'}>No Managers to display.</div>
                        }
                    </div>
                </section>
                {
                    teamsM && <section className={'teams'}>
                        <h1>Your Teams</h1>
                        {
                            displaySeeAllTeamsButton && <Link
                                to={'/org/teams'}
                            >See all Teams</Link>
                        }
                        <div className={'list'}>
                            {teamLoading && <Loader />}
                            {(teams?.length && (
                                teams.map((team, i) => (
                                    <div key={i}>{team.name}</div>
                                ))
                            )) || <div className={'empty'}>No Teams to display.</div>}
                        </div>
                    </section>
                }
            </div>
            <div className={'column right'}>
                {
                    projectsM && <section className={'teams'}>
                        <h1 className={'header'}>Your Projects</h1>
                        {
                            displaySeeAllProjectsButton && <Link
                                to={'/org/projects'}
                            >See all Projects</Link>
                        }
                        <div className={'list'}>
                            {projectsLoading && <Loader />}
                            {(projects?.length && (
                                projects.map((project, i) => (
                                    <div key={i}>{project.name}</div>
                                ))
                            ))  || <div className={'empty'}>No Teams to display.</div>}
                        </div>
                    </section>
                }
                {
                    branchesM && <>
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
            </div>
        </>
    );
};

export default OrganizationIndex;