// FRONTEND/components/Teams/Index.js
import React from "react";
import { useModals } from "../../contexts/ModalContext";
import '../../assets/styles/Teams.css';
import Button from "../Button";
import InWorks from "../InWorks";

const TeamsIndex = () => {
    const { openModal } = useModals();

    return (
        <>
            <h1>Teams in Zyrah</h1>
            <Button
                className="new-team-button"
                onClick={() => openModal({ type: 'teamNew' })}
                label={'Add new Team'}
                icon={'add'}
            />
            <InWorks
                title={'Teams'}
                icon={'groups'}
                description={"There will be a table of teams with following columns: team names, codename, managers and team leaders. If the branch and projects modules are enabled they are also gonna be present there."}
            />
        </>
    );
};

export default TeamsIndex;