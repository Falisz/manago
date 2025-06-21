import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Loading } from './Common';

const PostsShow = () => {
    const { postId } = useParams(); // Pobieramy postId z URL
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

        fetchPost();
    }, [postId]);

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div>
                {error && <p>{error}</p>}
            </div>
        )
    }

    return (
        <div title={`Post ${postId}`}>
            <h1>{post.title}</h1>
            <p>{post.content}</p>
        </div>
    );
};

export default PostsShow;