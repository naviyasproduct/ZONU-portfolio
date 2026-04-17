"use client";
import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AdminTopNav from '../../components/AdminTopNav';

export default function ManageThoughtsPage() {
  const router = useRouter();
  const [thoughts, setThoughts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDates, setExpandedDates] = useState({});

  // Load all thoughts
  useEffect(() => {
    const loadThoughts = async () => {
      try {
        const q = query(collection(db, 'thoughts'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const thoughtsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
        }));
        setThoughts(thoughtsData);
        
        // Set today's date as expanded by default
        const todayStr = new Date().toDateString();
        setExpandedDates({ [todayStr]: true });
      } catch (err) {
        console.error('Error loading thoughts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadThoughts();
  }, []);

  // Delete thought
  const handleDelete = async (id, mediaUrl) => {
    if (!confirm('Are you sure you want to delete this thought? This action cannot be undone.')) return;

    setDeleting(id);
    try {
      const response = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, mediaUrl })
      });

      const data = await response.json();

      if (data.success) {
        setThoughts(thoughts.filter(t => t.id !== id));
        alert('Thought deleted successfully!');
      } else {
        alert('Failed to delete thought: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting thought:', error);
      alert('Error deleting thought');
    } finally {
      setDeleting(null);
    }
  };

  // Filter thoughts based on search
  const filteredThoughts = thoughts.filter(thought => {
    const searchLower = searchTerm.toLowerCase();
    return (
      thought.title?.toLowerCase().includes(searchLower) ||
      thought.content?.toLowerCase().includes(searchLower)
    );
  });

  // Group thoughts by date
  const groupedThoughts = filteredThoughts.reduce((acc, thought) => {
    const dateStr = thought.createdAt.toDateString();
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(thought);
    return acc;
  }, {});

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedThoughts).sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  // Get today's date string
  const today = new Date().toDateString();

  // Toggle date expansion
  const toggleDate = (dateStr) => {
    setExpandedDates(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr]
    }));
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ fontSize: '1.25rem', opacity: 0.7 }}>Loading thoughts...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 3vw, 1.5rem)',
    }}>
      <AdminTopNav />
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '2rem',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 2.75rem)',
              fontWeight: '700',
              margin: 0,
            }}>
              Manage Thoughts
            </h1>
            <Link
              href="/thoughts/admin"
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                display: 'inline-block',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              + Add New Thought
            </Link>
          </div>

          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search thoughts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              fontSize: '1rem',
              color: 'inherit',
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          />

          {/* Stats */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1rem',
            flexWrap: 'wrap',
          }}>
            <div style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              fontSize: '0.875rem',
              opacity: 0.8,
            }}>
              Total: {thoughts.length}
            </div>
            <div style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              fontSize: '0.875rem',
              opacity: 0.8,
            }}>
              Found: {filteredThoughts.length}
            </div>
            <div style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              fontSize: '0.875rem',
              opacity: 0.8,
            }}>
              Dates: {sortedDates.length}
            </div>
          </div>
        </div>

        {/* Thoughts List - Grouped by Date */}
        {filteredThoughts.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.7, fontSize: '1.1rem', marginTop: '3rem' }}>
            {searchTerm ? 'No thoughts found matching your search.' : 'No thoughts yet. Create your first one!'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {sortedDates.map((dateStr) => {
              const isToday = dateStr === today;
              const date = new Date(dateStr);
              const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
              const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

              const isExpanded = expandedDates[dateStr];

              return (
                <div key={dateStr}>
                  {/* Date Header - Clickable */}
                  <div 
                    onClick={() => toggleDate(dateStr)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: isExpanded ? '1.25rem' : '0',
                      paddingBottom: '0.75rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.marginLeft = '-1rem';
                      e.currentTarget.style.marginRight = '-1rem';
                      e.currentTarget.style.paddingLeft = '1rem';
                      e.currentTarget.style.paddingRight = '1rem';
                      e.currentTarget.style.borderRadius = '12px';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.marginLeft = '0';
                      e.currentTarget.style.marginRight = '0';
                      e.currentTarget.style.paddingLeft = '0';
                      e.currentTarget.style.paddingRight = '0';
                      e.currentTarget.style.borderRadius = '0';
                    }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: isToday ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${isToday ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      fontWeight: '600',
                    }}>
                      {isExpanded ? '📅' : '📁'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}>
                        {isToday && (
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(99, 102, 241, 0.3)',
                            borderRadius: '6px',
                            fontWeight: '500',
                          }}>
                            Today
                          </span>
                        )}
                        {dayName}
                      </div>
                      <div style={{
                        fontSize: '0.9rem',
                        opacity: 0.7,
                        marginTop: '0.15rem',
                      }}>
                        {monthDay}
                      </div>
                    </div>
                    <div style={{
                      padding: '0.35rem 0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      opacity: 0.7,
                      marginRight: '0.5rem',
                    }}>
                      {groupedThoughts[dateStr].length} {groupedThoughts[dateStr].length === 1 ? 'thought' : 'thoughts'}
                    </div>
                    <div style={{
                      fontSize: '1.5rem',
                      opacity: 0.6,
                      transition: 'transform 0.2s ease',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}>
                      ▶
                    </div>
                  </div>

                  {/* Thoughts for this date - Only show if expanded */}
                  {isExpanded && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))',
                      gap: 'clamp(1rem, 2vw, 1.5rem)',
                      animation: 'fadeIn 0.3s ease',
                    }}>
                      {groupedThoughts[dateStr].map((thought) => (
                      <div
                        key={thought.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.2)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        }}
                      >
                        {/* Image */}
                        {thought.mediaUrl && (
                          <div style={{
                            width: '100%',
                            height: '200px',
                            position: 'relative',
                            background: 'rgba(0, 0, 0, 0.3)',
                          }}>
                            <Image
                              src={thought.mediaUrl}
                              alt={thought.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 350px"
                              style={{ objectFit: 'contain' }}
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          {/* Title */}
                          <h3 style={{
                            fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
                            fontWeight: '700',
                            marginBottom: '0.75rem',
                            lineHeight: 1.3,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            {thought.title}
                          </h3>

                          {/* Content Preview */}
                          {thought.content && (
                            <p style={{
                              fontSize: '0.95rem',
                              opacity: 0.8,
                              lineHeight: 1.6,
                              marginBottom: '1rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}>
                              {thought.content}
                            </p>
                          )}

                          {/* Actions */}
                          <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            marginTop: 'auto',
                            flexWrap: 'wrap',
                          }}>
                            <Link
                              href={`/thoughts/${thought.id}`}
                              style={{
                                flex: '1',
                                minWidth: '80px',
                                padding: '0.65rem 1rem',
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '10px',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                textAlign: 'center',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                              }}
                            >
                              View
                            </Link>
                            <Link
                              href={`/thoughts/${thought.id}/edit`}
                              style={{
                                flex: '1',
                                minWidth: '80px',
                                padding: '0.65rem 1rem',
                                background: 'rgba(99, 102, 241, 0.15)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                borderRadius: '10px',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                textAlign: 'center',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                              }}
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(thought.id, thought.mediaUrl)}
                              disabled={deleting === thought.id}
                              style={{
                                flex: '1',
                                minWidth: '80px',
                                padding: '0.65rem 1rem',
                                background: deleting === thought.id ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '10px',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                color: 'inherit',
                                cursor: deleting === thought.id ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                if (deleting !== thought.id) {
                                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (deleting !== thought.id) {
                                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                                }
                              }}
                            >
                              {deleting === thought.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
