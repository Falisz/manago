import React, { useEffect, useState } from 'react';
import {useParams, useNavigate, Link} from 'react-router-dom';
import axios from 'axios';
import { Loader } from '../Loader';
import PostDetail from './Detail';

const PostIndex = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPostId, setSelectedPostId] = useState(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await axios.get('/api/posts', { withCredentials: true });
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

    useEffect(() => {
        if (postId) {
            setSelectedPostId(parseInt(postId));
        } else {
            setSelectedPostId(null);
        }
    }, [postId]);

    const closePostModal = () => {
        setSelectedPostId(null);
        navigate('/posts');
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <>
            {posts.length === 0 || error ? (
                <p>No posts available.</p>
            ) : (
                <ul className="post-list">
                    {posts.map(post => (
                        <li key={post.ID} className="post-item">
                            <h2>
                                <Link
                                    to={`/posts/${post.ID}`}
                                    className="post-title-button"
                                >
                                    {post.title || 'Untitled Post'}
                                </Link>
                            </h2>
                            <p>
                                Posted by {post.User.first_name} {post.User.last_name} on{' '}
                                {new Date(post.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                            <p>Channel: {post.Channel.name}</p>
                            <p>
                                {post.content.length > 200
                                    ? `${post.content.substring(0, 200)}...`
                                    : post.content}
                            </p>
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
                        </li>
                    ))}
                </ul>
            )}
            {selectedPostId && (
                <PostDetail postId={selectedPostId} onClose={closePostModal} />
            )}
        </>
    );
};

export default PostIndex;