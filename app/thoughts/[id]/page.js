"use client";
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// Block Renderer Component (for new block structure)
function BlockRenderer({ blocks }) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
    }}>
      {blocks.map((block, idx) => {
        if (block.type === 'text') {
          return (
            <div
              key={idx}
              style={{
                fontSize: '1.1rem',
                lineHeight: '1.8',
                opacity: 0.9,
                textAlign: 'left',
                whiteSpace: 'pre-wrap',
              }}
            >
              {block.content}
            </div>
          );
        }

        if (block.type === 'image') {
          const alignment = block.alignment || 'center';
          const widthPercent = block.widthPercent || 80;

          const alignmentMap = {
            left: 'flex-start',
            center: 'center',
            right: 'flex-end',
          };

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: alignmentMap[alignment],
                width: '100%',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ width: `${widthPercent}%` }}>
                <Image
                  src={block.url}
                  alt={`Image ${idx + 1}`}
                  width={800}
                  height={600}
                  style={{
                    width: '100%',
                    height: 'auto',
                  }}
                />
              </div>
            </div>
          );
        }

        if (block.type === 'video') {
          const alignment = block.alignment || 'center';
          const widthPercent = block.widthPercent || 80;

          const alignmentMap = {
            left: 'flex-start',
            center: 'center',
            right: 'flex-end',
          };

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: alignmentMap[alignment],
                width: '100%',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ width: `${widthPercent}%` }}>
                <video
                  controls
                  src={block.url}
                  style={{
                    width: '100%',
                  }}
                />
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

// Rich Content Renderer Component (for old content structure)
function RichContent({ content, additionalMedia }) {
  console.log('🎨 RichContent rendering:', {
    contentLength: content?.length,
    additionalMediaCount: additionalMedia?.length,
    additionalMedia,
  });
  
  const lines = content.split('\n');
  let mediaIndex = 0;
  
  return (
    <div style={{
      fontSize: '1.1rem',
      lineHeight: '1.8',
      opacity: 0.9,
      textAlign: 'left',
    }}>
      {lines.map((line, idx) => {
        // Check for media placeholders
        const imageMatch = line.match(/\[Image:\s*(\w+),\s*(\d+)%\]/i);
        const videoMatch = line.match(/\[Video:\s*(\w+),\s*(\d+)%\]/i);
        const audioMatch = line.match(/\[Audio\]/i);
        
        if (imageMatch) {
          console.log('🖼️ Image placeholder found:', {
            line,
            match: imageMatch,
            mediaIndex,
            hasMedia: mediaIndex < additionalMedia.length,
            media: additionalMedia[mediaIndex],
          });
        }
        
        if (imageMatch && mediaIndex < additionalMedia.length) {
          const media = additionalMedia[mediaIndex];
          const alignment = imageMatch[1] || 'center';
          const widthPercent = parseInt(imageMatch[2]) || 70;
          mediaIndex++;
          
          const alignmentMap = {
            left: 'flex-start',
            center: 'center',
            right: 'flex-end'
          };
          
          return (
            <div 
              key={`media-${idx}`}
              style={{
                display: 'flex',
                justifyContent: alignmentMap[alignment] || 'center',
                margin: '2rem 0',
              }}
            >
              <div style={{
                width: `${widthPercent}%`,
              }}>
                <Image
                  src={media.url}
                  alt="Content image"
                  width={800}
                  height={600}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                  }}
                />
              </div>
            </div>
          );
        } else if (videoMatch && mediaIndex < additionalMedia.length) {
          const media = additionalMedia[mediaIndex];
          const alignment = videoMatch[1] || 'center';
          const widthPercent = parseInt(videoMatch[2]) || 70;
          mediaIndex++;
          
          const alignmentMap = {
            left: 'flex-start',
            center: 'center',
            right: 'flex-end'
          };
          
          return (
            <div 
              key={`media-${idx}`}
              style={{
                display: 'flex',
                justifyContent: alignmentMap[alignment] || 'center',
                margin: '2rem 0',
              }}
            >
              <div style={{
                width: `${widthPercent}%`,
              }}>
                <video
                  controls
                  src={media.url}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                  }}
                />
              </div>
            </div>
          );
        } else if (audioMatch && mediaIndex < additionalMedia.length) {
          const media = additionalMedia[mediaIndex];
          mediaIndex++;
          
          return (
            <div key={`media-${idx}`} style={{ margin: '2rem 0' }}>
              <audio controls src={media.url} style={{ width: '100%' }} />
            </div>
          );
        } else if (line.match(/^---+$/)) {
          // Divider - Full width decorative line
          return (
            <div 
              key={`divider-${idx}`}
              style={{
                margin: '3rem 0',
                width: '100%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5), rgba(168, 85, 247, 0.5), transparent)',
                borderRadius: '2px',
                boxShadow: '0 0 10px rgba(99, 102, 241, 0.3)',
              }}
            />
          );
        } else if (line.trim().startsWith('"') && line.trim().endsWith('"')) {
          // Quote
          return (
            <blockquote 
              key={`quote-${idx}`}
              style={{
                margin: '2rem 0',
                padding: '1.5rem 2rem',
                borderLeft: '4px solid rgba(99, 102, 241, 0.5)',
                background: 'rgba(99, 102, 241, 0.05)',
                borderRadius: '8px',
                fontStyle: 'italic',
                fontSize: '1.2rem',
              }}
            >
              {line.trim().slice(1, -1)}
            </blockquote>
          );
        } else if (line.trim()) {
          // Regular text
          return <p key={`text-${idx}`} style={{ marginBottom: '1rem' }}>{line}</p>;
        } else {
          // Empty line
          return <br key={`br-${idx}`} />;
        }
      })}
    </div>
  );
}

export default function ThoughtPage() {
  const params = useParams();
  const [thought, setThought] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Comments state
  const [comments, setComments] = useState([]);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  
  // Likes state
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [likingInProgress, setLikingInProgress] = useState(false);

  // Load thought data
  useEffect(() => {
    let mounted = true;
    
    async function loadThought() {
      if (!params?.id) return;
      
      setLoading(true);
      try {
        const docRef = doc(db, 'thoughts', params.id);
        const docSnap = await getDoc(docRef);
        
        if (!mounted) return;
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          console.log('📥 Thought data loaded from Firestore:', {
            id: data.id,
            title: data.title,
            contentLength: data.content?.length,
            hasAdditionalMedia: !!data.additionalMedia,
            additionalMediaCount: data.additionalMedia?.length || 0,
            additionalMedia: data.additionalMedia,
          });
          setThought(data);
          setLikeCount(data.likeCount || 0);
          
          // Check if user has already liked (using localStorage)
          const likedThoughts = JSON.parse(localStorage.getItem('likedThoughts') || '[]');
          setHasLiked(likedThoughts.includes(params.id));
        } else {
          setError('Thought not found');
        }
      } catch (err) {
        console.error('[ThoughtPage] Error loading thought:', err);
        if (mounted) {
          setError('Failed to load thought');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    
    loadThought();
    return () => { mounted = false };
  }, [params?.id]);

  // Load comments in real-time
  useEffect(() => {
    if (!params?.id) return;
    
    const commentsRef = collection(db, 'thoughts', params.id, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(commentsData);
    });
    
    return () => unsubscribe();
  }, [params?.id]);

  // Handle like/unlike
  const handleLike = async () => {
    if (likingInProgress || !params?.id) return;
    
    setLikingInProgress(true);
    try {
      const thoughtRef = doc(db, 'thoughts', params.id);
      const likedThoughts = JSON.parse(localStorage.getItem('likedThoughts') || '[]');
      
      if (hasLiked) {
        // Unlike
        await updateDoc(thoughtRef, {
          likeCount: increment(-1)
        });
        setLikeCount(prev => Math.max(0, prev - 1));
        setHasLiked(false);
        const updated = likedThoughts.filter(id => id !== params.id);
        localStorage.setItem('likedThoughts', JSON.stringify(updated));
      } else {
        // Like
        await updateDoc(thoughtRef, {
          likeCount: increment(1)
        });
        setLikeCount(prev => prev + 1);
        setHasLiked(true);
        likedThoughts.push(params.id);
        localStorage.setItem('likedThoughts', JSON.stringify(likedThoughts));
      }
    } catch (err) {
      console.error('[ThoughtPage] Error toggling like:', err);
      alert('Failed to update like. Please try again.');
    } finally {
      setLikingInProgress(false);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim() || !params?.id) return;
    
    setSubmittingComment(true);
    try {
      const commentsRef = collection(db, 'thoughts', params.id, 'comments');
      await addDoc(commentsRef, {
        name: commentName.trim() || 'Anonymous',
        text: commentText.trim(),
        createdAt: new Date()
      });
      
      // Clear form
      setCommentName('');
      setCommentText('');
    } catch (err) {
      console.error('[ThoughtPage] Error adding comment:', err);
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{
          padding: '3rem',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        }}>
          <div className="animate-pulse" style={{ fontSize: '1.1rem', opacity: 0.7 }}>
            Loading thought...
          </div>
        </div>
      </div>
    );
  }

  if (error || !thought) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{
          padding: '3rem',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          textAlign: 'center',
          maxWidth: '500px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            {error || 'Thought not found'}
          </h2>
          <Link 
            href="/thoughts"
            style={{
              display: 'inline-block',
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              borderRadius: '12px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            ← Back to Thoughts
          </Link>
        </div>
      </div>
    );
  }

  const date = thought.createdAt?.toDate ? thought.createdAt.toDate() : new Date();
  const formattedDate = date.toLocaleDateString('default', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div style={{
      minHeight: '100vh',
      padding: '3rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* Back Button */}
      <div style={{
        width: '100%',
        maxWidth: '800px',
        marginBottom: '2rem',
      }}>
        <Link 
          href="/thoughts"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '0.95rem',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'translateX(-4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>←</span>
          <span>Back to Thoughts</span>
        </Link>
      </div>

      {/* Main Content */}
      <article style={{
        width: '100%',
        maxWidth: '800px',
        padding: 'clamp(1.5rem, 4vw, 3rem)',
      }}>
        {/* Date & Time */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(0.5rem, 1.5vw, 1rem)',
          marginBottom: '2rem',
          fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
          opacity: 0.6,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          <span>{formattedDate}</span>
          <span>•</span>
          <span>{formattedTime}</span>
        </div>

        {/* Title */}
        {thought.title && (
          <h1 
            className="theme-text"
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '800',
              marginBottom: '2rem',
              lineHeight: '1.2',
              textAlign: 'center',
            }}
          >
            {thought.title}
          </h1>
        )}

        {/* Media - Only show if using old structure (no blocks) */}
        {thought.mediaUrl && (!thought.blocks || thought.blocks.length === 0) && (
          <div style={{
            marginBottom: '2.5rem',
          }}>
            {thought.mediaType && thought.mediaType.startsWith('video') ? (
              <div
                style={{
                  width: '100%',
                  height: 'clamp(240px, 56vw, 640px)',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <video
                  controls
                  src={thought.mediaUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: 'clamp(240px, 56vw, 640px)',
                  position: 'relative',
                  background: 'transparent',
                }}
              >
                <Image
                  src={thought.mediaUrl}
                  alt={thought.title || 'thought'}
                  fill
                  sizes="(max-width: 800px) 100vw, 800px"
                  style={{
                    objectFit: 'contain',
                    display: 'block',
                  }}
                  priority
                />
              </div>
            )}
          </div>
        )}

        {/* Content with Media Blocks */}
        {/* Render new block structure if available, otherwise fall back to old structure */}
        {thought.blocks && thought.blocks.length > 0 ? (
          <BlockRenderer blocks={thought.blocks} />
        ) : thought.content ? (
          <div>
            <RichContent content={thought.content} additionalMedia={thought.additionalMedia || []} />
          </div>
        ) : null}

        {/* Likes & Share Section */}
        <div style={{
          marginTop: '3rem',
          paddingTop: '2rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={likingInProgress}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: hasLiked 
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(30px)',
              border: hasLiked 
                ? '2px solid rgba(239, 68, 68, 0.3)'
                : '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: likingInProgress ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: likingInProgress ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!likingInProgress) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = hasLiked 
                  ? '0 4px 16px rgba(239, 68, 68, 0.3)'
                  : '0 4px 16px rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{hasLiked ? '❤️' : '🤍'}</span>
            <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Link copied to clipboard! 📋');
            }}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            📋 Share
          </button>
        </div>
      </article>

      {/* Comments Section */}
      <div style={{
        width: '100%',
        maxWidth: '800px',
        marginTop: '2rem',
        padding: '2.5rem',
      }}>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          marginBottom: '2rem',
          textAlign: 'center',
        }}>
          💬 Comments ({comments.length})
        </h2>

        {/* Comment Form */}
        <form onSubmit={handleCommentSubmit} style={{
          marginBottom: '2rem',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <label 
              htmlFor="commentName"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                opacity: 0.8,
              }}
            >
              Nickname *
            </label>
            <input
              type="text"
              id="commentName"
              value={commentName}
              onChange={(e) => setCommentName(e.target.value)}
              required
              maxLength={30}
              placeholder="Enter your nickname"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1.5px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label 
              htmlFor="commentText"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                opacity: 0.8,
              }}
            >
              Your Comment *
            </label>
            <textarea
              id="commentText"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              required
              rows={4}
              maxLength={500}
              placeholder="Share your thoughts..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1.5px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.3s ease',
                resize: 'vertical',
                minHeight: '100px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
              }}
            />
            <div style={{
              textAlign: 'right',
              fontSize: '0.75rem',
              opacity: 0.5,
              marginTop: '0.25rem',
            }}>
              {commentText.length}/500
            </div>
          </div>

          <button
            type="submit"
            disabled={submittingComment || !commentText.trim() || !commentName.trim()}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: submittingComment || !commentText.trim() || !commentName.trim()
                ? 'rgba(255, 255, 255, 0.1)'
                : 'linear-gradient(135deg, #6366f1, #a855f7)',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: submittingComment || !commentText.trim() || !commentName.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: submittingComment || !commentText.trim() || !commentName.trim() ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!submittingComment && commentText.trim() && commentName.trim()) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {submittingComment ? 'Posting...' : 'Post Comment'}
          </button>
        </form>

        {/* Comments List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {comments.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              opacity: 0.5,
            }}>
              <p style={{ fontSize: '1.1rem' }}>No comments yet. Be the first to share your thoughts! 💭</p>
            </div>
          ) : (
            comments.map(comment => (
              <div
                key={comment.id}
                style={{
                  padding: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                }}>
                  <div style={{
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    opacity: 0.9,
                  }}>
                    {comment.name}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    opacity: 0.5,
                  }}>
                    {comment.createdAt?.toDate ? 
                      comment.createdAt.toDate().toLocaleDateString('default', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                      : 'Just now'
                    }
                  </div>
                </div>
                <div style={{
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  opacity: 0.85,
                  whiteSpace: 'pre-wrap',
                }}>
                  {comment.text}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
