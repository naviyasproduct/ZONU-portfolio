"use client";
import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import Image from 'next/image';
import { db } from '../../lib/firebaseConfig';

export default function ThoughtsClient() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [thoughtStats, setThoughtStats] = useState({});

  useEffect(() => {
    let mounted = true;

    async function fetchCommentCounts(thoughts) {
      try {
        const entries = await Promise.all(
          thoughts.map(async (thought) => {
            try {
              const commentsSnap = await getDocs(collection(db, 'thoughts', thought.id, 'comments'));
              return [thought.id, { likes: thought.likeCount || 0, comments: commentsSnap.size }];
            } catch (err) {
              console.error('[ThoughtsClient] Error loading comments for', thought.id, err);
              return [thought.id, { likes: thought.likeCount || 0, comments: 0 }];
            }
          })
        );

        if (mounted) setThoughtStats(Object.fromEntries(entries));
      } catch (err) {
        console.error('[ThoughtsClient] Error fetching comment counts:', err);
      }
    }

    async function load() {
      setLoading(true);
      try {
        const q = query(collection(db, 'thoughts'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        if (!mounted) return;

        const postsData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPosts(postsData);
        await fetchCommentCounts(postsData);
      } catch (err) {
        console.error('[ThoughtsClient] Error loading posts:', err);
        if (mounted) setPosts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
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
  }

  if (!posts.length) {
    return (
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
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
        <p style={{ fontSize: '1.1rem', opacity: 0.7 }}>No thoughts shared yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        width: '100%',
      }}
    >
      {posts.map((post) => {
        const createdLabel = post.createdAt?.toDate
          ? post.createdAt.toDate().toLocaleString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '';

        const topic = typeof post.title === 'string' && post.title.trim() ? post.title.trim() : 'Thought';

        const snippet = typeof post.content === 'string'
          ? post.content.replace(/\s+/g, ' ').trim().slice(0, 160)
          : '';

        return (
          <a
            key={post.id}
            href={`/thoughts/${post.id}`}
            style={{
              display: 'block',
              width: '100%',
              maxWidth: '900px',
              margin: '0 auto',
              padding: '1.25rem',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              transition: 'all 0.25s ease',
              textDecoration: 'none',
              color: 'inherit',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div style={{ marginBottom: '0.85rem' }}>
              <div
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 750,
                  lineHeight: 1.25,
                  margin: 0,
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(168, 85, 247, 0.95))',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  letterSpacing: '-0.2px',
                }}
              >
                {topic}
              </div>

              {createdLabel && (
                <div
                  style={{
                    fontSize: '0.85rem',
                    opacity: 0.65,
                    marginTop: '0.35rem',
                    letterSpacing: '0.2px',
                  }}
                >
                  {createdLabel}
                </div>
              )}
            </div>

            {post.mediaUrl && (
              <div
                style={{
                  marginBottom: '1rem',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {post.mediaType && post.mediaType.startsWith('video') ? (
                  <video
                    src={post.mediaUrl}
                    style={{
                      width: '100%',
                      height: '220px',
                      objectFit: 'cover',
                      display: 'block',
                      pointerEvents: 'none',
                    }}
                  />
                ) : (
                  <Image
                    src={post.mediaUrl}
                    alt={post.title || 'thought'}
                    width={900}
                    height={280}
                    style={{
                      width: '100%',
                      height: '220px',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                )}
              </div>
            )}

            {snippet && (
              <p
                style={{
                  margin: 0,
                  opacity: 0.75,
                  lineHeight: 1.55,
                }}
              >
                {snippet}{typeof post.content === 'string' && post.content.length > 160 ? '…' : ''}
              </p>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                marginTop: '0.9rem',
                paddingTop: '0.9rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '0.9rem',
                opacity: 0.75,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1.05rem' }}>❤️</span>
                  <span>{thoughtStats[post.id]?.likes ?? post.likeCount ?? 0}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1.05rem' }}>💬</span>
                  <span>{thoughtStats[post.id]?.comments ?? 0}</span>
                </div>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}