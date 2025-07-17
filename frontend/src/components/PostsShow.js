import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Loader from "./Loader";
import Modal from "./Modal";

const PostsShow = ({ postId, onClose }) => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await axios.get(`/api/posts/${postId}`, { withCredentials: true });
                setPost(res.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching post:', err);
                setError('Post not found');
                setLoading(false);
            }
        };

        fetchPost().then();
    }, [postId]);

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
                <h1>Post not found!</h1>
            </Modal>
        );
    }

    return (
        <>
            <Modal onClose={onClose} closeButton={true}>
                <h1>{post.title || 'Untitled Post'}</h1>
                <p>Posted by {post.User.first_name} {post.User.last_name}</p>
                <p>Channel: {post.Channel.name}</p>
                <p>
                    {new Date(post.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </p>
                <p>{post.content}</p>
                {post.isEdited && (
                    <p>
                        Last edited:{' '}
                        {new Date(post.updatedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                )}
            </Modal>
        </>
    );
};

export default PostsShow;