// FRONTEND/components/Holidays/Edit.js
import React from 'react';
import {useHolidays} from '../../hooks/useResource';
import EditForm from '../EditForm';
import Loader from '../Loader';

const HolidayEdit = ({ id, modal }) => {
    const { holiday, loading, setLoading, fetchHoliday, saveHoliday } = useHolidays();

    React.useEffect(() => {
        if (id)
            fetchHoliday({id}).then();
        else
            setLoading(false);

    }, [id, setLoading, fetchHoliday]);

    const sections = React.useMemo(() => ({
        0: {
            fields: {
                name: {
                    type: 'input',
                    label: 'Name',
                    required: true
                },
            }
        },
        1: {
            fields: {
                date: {
                    type: 'date',
                    label: 'Date',
                    required: true
                }
            }
        }
    }), []);

    const presetData = React.useMemo(() => {
        return holiday ? holiday : {};
    }, [holiday]);

    if (loading)
        return <Loader />;

    return <EditForm
        header={id && holiday ? `Editing ${holiday.name}` : 'Creating new Holiday'}
        sections={sections}
        onSubmit={async (data) => await saveHoliday({id, data})}
        modal={modal}
        presetData={presetData}
    />;
};

export default HolidayEdit;