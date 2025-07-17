import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Loader from "../Loader";
import Modal from "../Modal";

const UserDetail = ({ userId, onClose }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await axios.get(`/api/users/${userId}`, { withCredentials: true });
                setUser(res.data);
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
            <Modal onClose={onClose}>
                <Loader />
            </Modal>
        );
    }

    if (error) {
        return (
            <Modal onClose={onClose}>
                <h1>{error}</h1>
            </Modal>
        );
    }

    return (
        <>
            <Modal onClose={onClose} closeButton={true}>
                <h1>{user.first_name + ' ' + user.last_name}</h1>
                <pre>
                    {JSON.stringify(user, ' ', 2)}
                </pre>
            </Modal>
        </>
    );
};

export default UserDetail;