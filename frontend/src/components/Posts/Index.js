import React, { useEffect, useState } from 'react';
import {useParams, useNavigate, Link} from 'react-router-dom';
import axios from 'axios';
import { Loader } from '../Loader';
import Modal from "../Modal";
import PostDetail from './Detail';

const PostIndex = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await axios.get('/posts', { withCredentials: true });
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
            setShowModal(true);
            setSelectedPostId(parseInt(postId));
        } else {
            setShowModal(false);
            setSelectedPostId(null);
        }
    }, [postId]);

    const closePostModal = () => {
        setSelectedPostId(null);
        setShowModal(false);
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
            <Modal
                hidden={!showModal}
                onClose={closePostModal}
                closeButton={true}
            >
                {selectedPostId && (
                    <PostDetail postId={selectedPostId} />
                )}
            </Modal>
        </>
    );
};

export default PostIndex;