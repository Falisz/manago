// FRONTEND/components/Test.jsx
import React, {useEffect} from 'react';
import useLeaves from "../hooks/useLeaves";

const Test = () => {

    const { fetchLeaves } = useLeaves();

    useEffect(() => {

        fetchLeaves({start_date: '2025-10-09'}).then(result => console.log(result));


    }, [fetchLeaves]);

    return <div>Test site.

        <input
            type={'time'}
        />
    </div>;
};

export default Test;