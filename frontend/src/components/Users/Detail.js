import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Loader from "../Loader";

const UserDetail = ({ userId }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await axios.get(`/api/users/${userId}`, { withCredentials: true });
                if (res.data)
                    setUser(res.data);
                else
                    setError('User not found');
                setLoading(false);
            } catch (err) {
                console.error('Error fetching post:', err);
                setError('User not found!');
                setLoading(false);
            }
        };

        fetchPost().then();
    }, [userId]);

    if (loading) {
        return (
            <Loader />
        );
    }

    if (error) {
        return (
            <h1>{error}</h1>
        );
    }

    return (
        <>
            <h1>{user?.first_name + ' ' + user?.last_name}</h1>
            <pre>
                {JSON.stringify(user, ' ', 2)}
            </pre>
        </>
    );
};

export default UserDetail;