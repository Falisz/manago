// FRONTEND/components/Posts/Index.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import useNav from '../../contexts/NavContext';
import Loader from '../Loader';
import '../../styles/Posts.css';

const PostIndex = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { openModal } = useNav();

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await axios.get('/posts');
                setPosts(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching posts:', err);
                setError('Failed to load posts. Please try again later.');
                setLoading(false);
            }
        };
        fetchPosts().then();
    }, []);

    if (loading) {
        return <Loader />;
    }

    return (
        <>
            {posts.length === 0 || error ? (
                <p>No posts available.</p>
            ) : (
                <ul className='post-list seethrough'>
                    {posts.map(post => (
                        <li key={post.id} className='post-item'>
                            <h2
                                className='post-title-button'
                                onClick={() => openModal({ content: 'postDetails', type: 'dialog', contentId: post.id })}>
                                {post.title || 'Untitled Post'}
                            </h2>
                            <p>
                                Posted by {post.author?.first_name} {post.author?.last_name} on{' '}
                                {new Date(post.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                            <p>Channel: {post.channel?.name}</p>
                            <p>
                                {post.content.length > 200
                                    ? `${post.content.substring(0, 200)}...`
                                    : post.content}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
};

export default PostIndex;