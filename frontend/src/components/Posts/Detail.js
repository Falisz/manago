import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Loader from "../Loader";

const PostDetail = ({ postId }) => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await axios.get(`/posts/${postId}`, { withCredentials: true });
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
            <Loader />
        );
    }

    if (error) {
        return (
            <h1>Post not found!</h1>
        );
    }

    return (
        <>
            <h1>{post.title || 'Untitled Post'}</h1>
            <p>Posted by {post.author?.first_name} {post.author?.last_name}</p>
            <p>Channel: {post.channel?.name}</p>
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
        </>
    );
};

export default PostDetail;