"use client";
import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import Image from 'next/image';

export default function ThoughtsClient() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDates, setExpandedDates] = useState(new Set());
  const [groupedPosts, setGroupedPosts] = useState({});
  const [thoughtStats, setThoughtStats] = useState({}); // Store like/comment counts

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const q = query(collection(db, 'thoughts'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        if (!mounted) return;
        
        const postsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPosts(postsData);
        
        // Group posts by date
        const grouped = {};
        const today = new Date().toDateString();
        
        postsData.forEach(post => {
          if (post.createdAt?.toDate) {
            const date = post.createdAt.toDate();
            const dateString = date.toDateString();
            
            if (!grouped[dateString]) {
              grouped[dateString] = [];
            }
            grouped[dateString].push(post);
          }
        });
        
        setGroupedPosts(grouped);
        
        // Auto-expand today's posts
        if (grouped[today]) {
          setExpandedDates(new Set([today]));
        }

        // Fetch comment counts for all thoughts
        await fetchCommentCounts(postsData);
        
      } catch (err) {
        console.error('[ThoughtsClient] Error loading posts:', err);
        if (mounted) {
          setPosts([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    async function fetchCommentCounts(thoughts) {
      try {
        const stats = {};
        
        // For each thought, get its comment count from subcollection
        for (const thought of thoughts) {
          const commentsSnap = await getDocs(
            collection(db, 'thoughts', thought.id, 'comments')
          );
          
          stats[thought.id] = {
            likes: thought.likeCount || 0, // likeCount is stored on the thought document itself
            comments: commentsSnap.size,
          };
        }

        if (mounted) {
          setThoughtStats(stats);
        }
      } catch (error) {
        console.error('Error fetching comment counts:', error);
      }
    }

    load();
    return () => { mounted = false };
  }, []);

  const toggleDate = (dateString) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateString)) {
        newSet.delete(dateString);
      } else {
        newSet.add(dateString);
      }
      return newSet;
    });
  };

  if (loading) return (
    <div 
      style={{
        width: '100%',
        maxWidth: '800px',
        padding: '3rem 2rem',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        margin: '0 auto',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="animate-pulse" style={{ fontSize: '1.1rem', opacity: 0.7 }}>
        Loading thoughts...
      </div>
    </div>
  );
  
  if (!posts.length) return (
    <div 
      style={{
        width: '100%',
        maxWidth: '800px',
        padding: '4rem 2rem',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        margin: '0 auto',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      }}
    >
      <p style={{ fontSize: '1.1rem', opacity: 0.7 }}>
        No thoughts shared yet. Check back soon! ✨
      </p>
    </div>
  );

  const today = new Date().toDateString();
  const sortedDates = Object.keys(groupedPosts).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '1.5rem',
      width: '100%',
    }}>
      {sortedDates.map(dateString => {
        const isToday = dateString === today;
        const isExpanded = expandedDates.has(dateString);
        const datePosts = groupedPosts[dateString];
        const date = new Date(dateString);
        const day = date.getDate();
        const monthName = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        
        return (
          <div key={dateString} style={{ width: '100%' }}>
            {/* Date Header - Calendar Style */}
            <button
              onClick={() => toggleDate(dateString)}
              style={{
                width: '100%',
                padding: isToday ? '1.5rem 2rem' : '1rem 1.5rem',
                background: isToday 
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))'
                  : 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(30px)',
                border: isToday 
                  ? '2px solid rgba(99, 102, 241, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                cursor: isToday ? 'default' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '1.5rem',
                marginBottom: isExpanded ? '1rem' : '0',
                boxShadow: isToday 
                  ? '0 8px 32px rgba(99, 102, 241, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)'
                  : '0 4px 16px rgba(0, 0, 0, 0.1)',
              }}
              onMouseEnter={(e) => {
                if (!isToday) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isToday) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {/* Calendar Date Circle */}
              <div
                style={{
                  minWidth: isToday ? '80px' : '60px',
                  height: isToday ? '80px' : '60px',
                  borderRadius: '16px',
                  background: isToday
                    ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                    : 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  boxShadow: isToday ? '0 8px 32px rgba(99, 102, 241, 0.3)' : 'none',
                }}
              >
                <div style={{ 
                  fontSize: isToday ? '2rem' : '1.5rem',
                  lineHeight: 1,
                }}>
                  {day}
                </div>
                <div style={{ 
                  fontSize: isToday ? '0.75rem' : '0.65rem',
                  opacity: 0.8,
                  marginTop: '2px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  {monthName}
                </div>
              </div>

              {/* Date Info */}
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ 
                  fontSize: isToday ? '1.5rem' : '1.1rem',
                  fontWeight: '600',
                  marginBottom: '0.25rem',
                }}>
                  {isToday ? '✨ Today' : `${monthName} ${day}, ${year}`}
                </div>
                <div style={{ 
                  fontSize: '0.9rem',
                  opacity: 0.6,
                }}>
                  {datePosts.length} {datePosts.length === 1 ? 'thought' : 'thoughts'}
                </div>
              </div>

              {/* Expand Icon */}
              {!isToday && (
                <div style={{
                  fontSize: '1.5rem',
                  opacity: 0.5,
                  transition: 'transform 0.3s ease',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>
                  ▼
                </div>
              )}
            </button>

            {/* Posts Grid - Show if expanded or if today */}
            {(isExpanded || isToday) && (
              <div style={{
                display: 'grid',
                gap: '1rem',
                marginTop: '1rem',
                marginLeft: '2rem', // Indent to show hierarchy
              }}>
                {datePosts.map(post => (
                  <a
                    key={post.id}
                    href={`/thoughts/${post.id}`}
                    style={{
                      display: 'block',
                      width: 'calc(100% - 4rem)', // Narrower than date tile
                      maxWidth: '600px', // Maximum width constraint
                      padding: '1.25rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(30px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                      textDecoration: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    {/* Image/Video - Always show if available */}
                    {post.mediaUrl && (
                      <div style={{
                        marginBottom: '1rem',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}>
                        {post.mediaType && post.mediaType.startsWith('video') ? (
                          <video 
                            src={post.mediaUrl}
                            style={{
                              width: '100%',
                              height: '200px',
                              objectFit: 'cover',
                              display: 'block',
                              pointerEvents: 'none', // Disable video controls in preview
                            }}
                          />
                        ) : (
                          <Image 
                            src={post.mediaUrl} 
                            alt={post.title || 'thought'} 
                            width={600}
                            height={200}
                            style={{
                              width: '100%',
                              height: '200px',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                        )}
                      </div>
                    )}

                    {/* Title - Always show */}
                    {post.title && (
                      <h3 style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        lineHeight: '1.4',
                        textAlign: 'center',
                        opacity: 0.9,
                        marginBottom: '0.75rem',
                      }}>
                        {post.title}
                      </h3>
                    )}

                    {/* Like and Comment Count */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '1.5rem',
                      marginTop: '0.75rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                      fontSize: '0.9rem',
                      opacity: 0.7,
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}>
                        <span style={{ fontSize: '1.1rem' }}>❤️</span>
                        <span>{thoughtStats[post.id]?.likes || 0}</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}>
                        <span style={{ fontSize: '1.1rem' }}>💬</span>
                        <span>{thoughtStats[post.id]?.comments || 0}</span>
                      </div>
                    </div>
                    
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

//for deployment testing only