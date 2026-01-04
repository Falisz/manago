// FRONTEND/Components/Timesheets/Settings.jsx
import React, {useMemo, useState} from 'react';
import useApp from '../../contexts/AppContext';
import EditForm from "../EditForm";

function GeneralSettings () {
    const { saveConfig, refreshPages } = useApp();
    const { timesheets: config } = useApp().appState;
    const [formConfig, setFormConfig] = useState({...config});

    const sections = useMemo(() => {
        return {
            0: {
                fields: {
                    attendance: {
                        label: 'Attendance',
                        type: 'checkbox',
                        disabled: formConfig.shiftBasedTimesheets
                    },
                    capLaborWithAttendance: {
                        label: 'Cap Labor With Attendance',
                        type: 'checkbox',
                        disabled: formConfig.shiftBasedTimesheets
                    },
                    projectTimesheets: {
                        label: 'Project Timesheets',
                        type: 'checkbox',
                        disabled: formConfig.shiftBasedTimesheets
                    },
                    shiftBasedTimesheets: {
                        label: 'Shift-based Timesheets',
                        type: 'checkbox'
                    }
                }
            }
        };
    }, [formConfig]);

    return <EditForm
        className={'seethrough app-scroll app-overflow-y'}
        style={{padding: '20px'}}
        sections={sections}
        onSubmit={async () => {
            await saveConfig(formConfig);
            await refreshPages();
        }}
        hideCancel={true}
        source={formConfig}
        setSource={setFormConfig}
    />;
}

const TimesheetsSettings = () => {
    return (
        <>
            <section className={'general-settings'}>
                <h1>Timesheets Settings</h1>
                <GeneralSettings />
            </section>
        </>
    );
};

export default TimesheetsSettings;