"use client";
import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import Link from 'next/link';
import Image from 'next/image';
import AdminTopNav from '../components/AdminTopNav';

export default function BlockBasedAdminClient() {
  // Content blocks system
  const [title, setTitle] = useState('');
  const [mainImage, setMainImage] = useState(null);
  const [contentBlocks, setContentBlocks] = useState([]);
  
  // UI state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBlockMenu, setShowBlockMenu] = useState(false);

  // Block types
  const BLOCK_TYPES = {
    TEXT: 'text',
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    QUOTE: 'quote',
    DIVIDER: 'divider',
  };

  async function load() {
    try {
      const q = query(collection(db, 'thoughts'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('[BlockBasedAdmin] load error:', err);
    }
  }

  useEffect(() => { load(); }, []);

  // Add a new content block
  const addBlock = (type) => {
    const newBlock = {
      id: Date.now(),
      type,
      content: '',
      file: null,
      alignment: 'left',
      size: 'medium',
    };
    setContentBlocks([...contentBlocks, newBlock]);
    setShowBlockMenu(false);
  };

  // Update block content
  const updateBlock = (id, field, value) => {
    setContentBlocks(contentBlocks.map(block => 
      block.id === id ? { ...block, [field]: value } : block
    ));
  };

  // Delete block
  const deleteBlock = (id) => {
    setContentBlocks(contentBlocks.filter(block => block.id !== id));
  };

  // Move block up/down
  const moveBlock = (index, direction) => {
    const newBlocks = [...contentBlocks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newBlocks.length) return;
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setContentBlocks(newBlocks);
  };

  // Upload media to Cloudinary
  async function uploadToCloudinary(file) {
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: form,
    });

    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return {
      url: data.secure_url,
      type: data.resource_type === 'video' ? 'video/*' : file.type || data.format,
    };
  }

  // Process all blocks and create final content
  async function processBlocks() {
    let finalContent = '';
    let mediaUrl = null;
    let mediaType = null;
    const additionalMedia = [];

    // Upload main image first
    if (mainImage) {
      const uploaded = await uploadToCloudinary(mainImage);
      mediaUrl = uploaded.url;
      mediaType = uploaded.type;
    }

    // Process each block
    for (const block of contentBlocks) {
      if (block.type === BLOCK_TYPES.TEXT) {
        finalContent += block.content + '\n\n';
      } else if (block.type === BLOCK_TYPES.QUOTE) {
        finalContent += `"${block.content}"\n\n`;
      } else if (block.type === BLOCK_TYPES.DIVIDER) {
        finalContent += '---\n\n';
      } else if (block.type === BLOCK_TYPES.IMAGE && block.file) {
        const uploaded = await uploadToCloudinary(block.file);
        additionalMedia.push({
          type: 'image',
          url: uploaded.url,
          alignment: block.alignment || 'center',
          widthPercent: block.widthPercent || 70,
        });
        finalContent += `[Image: ${block.alignment || 'center'}, ${block.widthPercent || 70}%]\n\n`;
      } else if (block.type === BLOCK_TYPES.VIDEO && block.file) {
        const uploaded = await uploadToCloudinary(block.file);
        additionalMedia.push({
          type: 'video',
          url: uploaded.url,
          alignment: block.alignment || 'center',
          widthPercent: block.widthPercent || 70,
        });
        finalContent += `[Video: ${block.alignment || 'center'}, ${block.widthPercent || 70}%]\n\n`;
      } else if (block.type === BLOCK_TYPES.AUDIO && block.file) {
        const uploaded = await uploadToCloudinary(block.file);
        additionalMedia.push({
          type: 'audio',
          url: uploaded.url,
        });
        finalContent += `[Audio]\n\n`;
      }
    }

    return { finalContent: finalContent.trim(), mediaUrl, mediaType, additionalMedia };
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    
    if (!title) {
      setError('Title is required!');
      return;
    }

    setLoading(true);
    
    try {
      const { finalContent, mediaUrl, mediaType, additionalMedia } = await processBlocks();

      console.log('📤 Sending to API:', {
        title,
        contentLength: finalContent.length,
        content: finalContent,
        mediaUrl,
        mediaType,
        additionalMediaCount: additionalMedia.length,
        additionalMedia,
      });

      const createRes = await fetch('/api/admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: finalContent,
          mediaUrl,
          mediaType,
          additionalMedia,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || 'Create failed');

      // Reset form
      setTitle('');
      setMainImage(null);
      setContentBlocks([]);
      await load();
    } catch (err) {
      console.error('Create failed', err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, mediaUrl) {
    if (!confirm('Delete this post?')) return;
    try {
      const res = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, mediaUrl })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      
      await load();
    } catch (err) {
      console.error('Delete failed', err);
      alert('Delete failed: ' + (err.message || String(err)));
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '1rem',
    }}>
      <AdminTopNav />
      {/* Logout Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <Link
          href="/thoughts/manage"
          style={{
            padding: '0.65rem 1.25rem',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1.5px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '12px',
            fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
            fontWeight: '600',
            color: 'inherit',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textDecoration: 'none',
            display: 'inline-block',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)';
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          📋 Manage Thoughts
        </Link>
        <button
          onClick={handleLogout}
          type="button"
          style={{
            padding: '0.65rem 1.25rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1.5px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
            fontWeight: '600',
            color: '#ef4444',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
          }}
        >
          🚪 Logout
        </button>
      </div>      {/* Create New Thought Section */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(30px)',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 'clamp(16px, 3vw, 24px)',
        padding: 'clamp(1.25rem, 4vw, 2.5rem)',
        marginBottom: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      }}>
        <h2 style={{ 
          fontSize: 'clamp(1.5rem, 4vw, 2rem)', 
          fontWeight: '700', 
          marginBottom: 'clamp(1rem, 3vw, 2rem)',
        }}>
          ✨ Create New Thought
        </h2>

        <form onSubmit={handleCreate}>
          {/* Title - Required */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.75rem',
              fontSize: '1rem',
              fontWeight: '600',
              opacity: 0.9,
            }}>
              📝 Title <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Enter your thought title..."
              style={{
                width: '100%',
                padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 2.5vw, 1.25rem)',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1.5px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
                fontWeight: '600',
                outline: 'none',
                transition: 'all 0.3s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Main Image - Required */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.75rem',
              fontSize: '1rem',
              fontWeight: '600',
              opacity: 0.9,
            }}>
              🖼️ Main Image
            </label>
            <div style={{
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '2px dashed rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setMainImage(e.target.files?.[0] || null)}
                style={{ marginBottom: '0.5rem' }}
              />
              {mainImage && (
                <div style={{ marginTop: '1rem', opacity: 0.7 }}>
                  ✅ {mainImage.name}
                </div>
              )}
            </div>
          </div>

          {/* Content Blocks */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}>
              <label style={{
                fontSize: '1rem',
                fontWeight: '600',
                opacity: 0.9,
              }}>
                📦 Content Blocks
              </label>
              <button
                type="button"
                onClick={() => setShowBlockMenu(!showBlockMenu)}
                style={{
                  padding: 'clamp(0.5rem, 1.5vw, 0.65rem) clamp(0.85rem, 2vw, 1rem)',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: 'clamp(0.85rem, 2vw, 0.9rem)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                + Add Block
              </button>
            </div>

            {/* Block Type Menu */}
            {showBlockMenu && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 'clamp(0.5rem, 1.5vw, 0.75rem)',
                marginBottom: '1.5rem',
                padding: 'clamp(0.75rem, 2vw, 1rem)',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <button type="button" onClick={() => addBlock(BLOCK_TYPES.TEXT)} style={blockButtonStyle}>
                  📝 Text
                </button>
                <button type="button" onClick={() => addBlock(BLOCK_TYPES.IMAGE)} style={blockButtonStyle}>
                  🖼️ Image
                </button>
                <button type="button" onClick={() => addBlock(BLOCK_TYPES.VIDEO)} style={blockButtonStyle}>
                  🎥 Video
                </button>
                <button type="button" onClick={() => addBlock(BLOCK_TYPES.AUDIO)} style={blockButtonStyle}>
                  🎵 Audio
                </button>
                <button type="button" onClick={() => addBlock(BLOCK_TYPES.QUOTE)} style={blockButtonStyle}>
                  💬 Quote
                </button>
                <button type="button" onClick={() => addBlock(BLOCK_TYPES.DIVIDER)} style={blockButtonStyle}>
                  ➖ Divider
                </button>
              </div>
            )}

            {/* Render Blocks */}
            {contentBlocks.length === 0 ? (
              <div style={{
                padding: '3rem',
                textAlign: 'center',
                opacity: 0.5,
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
              }}>
                No content blocks yet. Click &ldquo;+ Add Block&rdquo; to start building!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {contentBlocks.map((block, index) => (
                  <BlockEditor
                    key={block.id}
                    block={block}
                    index={index}
                    totalBlocks={contentBlocks.length}
                    onUpdate={updateBlock}
                    onDelete={deleteBlock}
                    onMove={moveBlock}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#ef4444',
              marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 'clamp(0.85rem, 2.5vw, 1rem)',
              background: loading 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'linear-gradient(135deg, #6366f1, #a855f7)',
              border: 'none',
              borderRadius: '12px',
              fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? '⏳ Creating...' : '🚀 Publish Thought'}
          </button>
        </form>
      </div>

      {/* Existing Thoughts List */}
      <div>
        <h2 style={{ 
          fontSize: 'clamp(1.25rem, 3.5vw, 1.75rem)', 
          fontWeight: '700', 
          marginBottom: '1.5rem',
        }}>
          📚 Your Thoughts ({posts.length})
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {posts.map(post => (
            <div
              key={post.id}
              style={{
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                position: 'relative',
              }}
            >
              <button
                onClick={() => handleDelete(post.id, post.mediaUrl)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  padding: '0.5rem 1rem',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                🗑️ Delete
              </button>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                {post.title}
              </h3>
              <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>
                {post.createdAt?.toDate?.()?.toLocaleString() || 'No date'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Block Editor Component
function BlockEditor({ block, index, totalBlocks, onUpdate, onDelete, onMove }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const previewRef = useState(null);
  
  const BLOCK_TYPES = {
    TEXT: 'text',
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    QUOTE: 'quote',
    DIVIDER: 'divider',
  };
  
  // Create preview URL when file changes
  useEffect(() => {
    console.log('🔍 Preview useEffect triggered:', {
      hasFile: !!block.file,
      type: block.type,
      fileName: block.file?.name,
      blockId: block.id,
    });
    
    if (block.file && (block.type === 'image' || block.type === 'video')) {
      try {
        const url = URL.createObjectURL(block.file);
        console.log('✅ Preview URL created:', url);
        setPreviewUrl(url);
        return () => {
          console.log('🧹 Cleaning up preview URL');
          URL.revokeObjectURL(url);
        };
      } catch (err) {
        console.error('❌ Failed to create preview URL:', err);
      }
    } else {
      console.log('❌ No preview (file or type missing)');
      setPreviewUrl(null);
    }
  }, [block.file, block.type, block.id]);
  
  // Handle drag-to-resize
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = block.widthPercent || 70;
    const containerWidth = e.target.closest('.preview-container')?.offsetWidth || 800;
    
    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.max(20, Math.min(100, startWidth + deltaPercent));
      onUpdate(block.id, 'widthPercent', Math.round(newWidth));
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div style={{
      padding: 'clamp(0.85rem, 2.5vw, 1.5rem)',
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '12px',
      position: 'relative',
    }}>
      {/* Block Controls */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{ fontSize: '0.9rem', fontWeight: '600', opacity: 0.8 }}>
          {getBlockIcon(block.type)} {getBlockLabel(block.type)}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {index > 0 && (
            <button
              type="button"
              onClick={() => onMove(index, 'up')}
              style={controlButtonStyle}
              title="Move up"
            >
              ↑
            </button>
          )}
          {index < totalBlocks - 1 && (
            <button
              type="button"
              onClick={() => onMove(index, 'down')}
              style={controlButtonStyle}
              title="Move down"
            >
              ↓
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(block.id)}
            style={{ ...controlButtonStyle, color: '#ef4444' }}
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Block Content */}
      {block.type === BLOCK_TYPES.TEXT && (
        <textarea
          value={block.content}
          onChange={(e) => onUpdate(block.id, 'content', e.target.value)}
          placeholder="Type your text here..."
          rows={5}
          style={textareaStyle}
        />
      )}

      {block.type === BLOCK_TYPES.QUOTE && (
        <textarea
          value={block.content}
          onChange={(e) => onUpdate(block.id, 'content', e.target.value)}
          placeholder="Enter your quote..."
          rows={3}
          style={{ ...textareaStyle, fontStyle: 'italic' }}
        />
      )}

      {(block.type === BLOCK_TYPES.IMAGE || block.type === BLOCK_TYPES.VIDEO) && (
        <>
          <input
            type="file"
            accept={block.type === BLOCK_TYPES.IMAGE ? 'image/*' : 'video/*'}
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              onUpdate(block.id, 'file', file);
              // Set default width if not set
              if (!block.widthPercent) {
                onUpdate(block.id, 'widthPercent', 70);
              }
            }}
            style={{ marginBottom: '1rem' }}
          />
          {block.file && (
            <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1rem' }}>
              ✅ {block.file.name}
            </div>
          )}
          
          {/* Alignment Buttons */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem', opacity: 0.7, display: 'block', marginBottom: '0.5rem' }}>
              Alignment:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['left', 'center', 'right'].map(align => (
                <button
                  key={align}
                  type="button"
                  onClick={() => onUpdate(block.id, 'alignment', align)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: block.alignment === align 
                      ? 'rgba(99, 102, 241, 0.3)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid ' + (block.alignment === align 
                      ? 'rgba(99, 102, 241, 0.5)' 
                      : 'rgba(255, 255, 255, 0.15)'),
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {align.charAt(0).toUpperCase() + align.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Width Slider */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem', opacity: 0.7, display: 'block', marginBottom: '0.5rem' }}>
              Width: {block.widthPercent || 70}%
            </label>
            <input
              type="range"
              min="20"
              max="100"
              value={block.widthPercent || 70}
              onChange={(e) => onUpdate(block.id, 'widthPercent', parseInt(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                outline: 'none',
                background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.3))',
                cursor: 'pointer',
              }}
            />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontSize: '0.75rem', 
              opacity: 0.5,
              marginTop: '0.25rem'
            }}>
              <span>20%</span>
              <span>100%</span>
            </div>
          </div>
          
          {/* Live Preview with Drag-to-Resize */}
          {previewUrl && (
            <div 
              className="preview-container"
              style={{
                marginTop: '1.5rem',
                padding: '1.5rem',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '12px',
                border: '2px solid rgba(99, 102, 241, 0.3)',
                position: 'relative',
              }}
            >
              <div style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                marginBottom: '1rem',
                textAlign: 'center',
                color: 'rgba(99, 102, 241, 1)',
              }}>
                📸 Live Preview - Drag edges to resize
              </div>
              <div style={{
                display: 'flex',
                justifyContent: block.alignment === 'left' ? 'flex-start' : block.alignment === 'right' ? 'flex-end' : 'center',
                minHeight: '150px',
                padding: '1rem',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
              }}>
                <div style={{
                  width: `${block.widthPercent || 70}%`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: isResizing 
                    ? '0 8px 32px rgba(99, 102, 241, 0.5)' 
                    : '0 4px 16px rgba(0, 0, 0, 0.3)',
                  border: isResizing 
                    ? '3px solid rgba(99, 102, 241, 0.8)' 
                    : '2px solid rgba(99, 102, 241, 0.5)',
                  position: 'relative',
                  transition: isResizing ? 'none' : 'all 0.2s ease',
                  cursor: 'ew-resize',
                }}>
                  {block.type === 'image' ? (
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      width={1200}
                      height={800}
                      unoptimized
                      onMouseDown={handleMouseDown}
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        pointerEvents: 'auto',
                        cursor: 'ew-resize',
                      }}
                    />
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <video
                        src={previewUrl}
                        controls
                        style={{
                          width: '100%',
                          height: 'auto',
                          display: 'block',
                        }}
                      />
                      <div
                        onMouseDown={handleMouseDown}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          cursor: 'ew-resize',
                          background: 'transparent',
                          pointerEvents: 'auto',
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Resize Handles */}
                  <div
                    onMouseDown={handleMouseDown}
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: -4,
                      bottom: 0,
                      width: '8px',
                      background: 'rgba(99, 102, 241, 0.6)',
                      cursor: 'ew-resize',
                      opacity: isResizing ? 1 : 0,
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => !isResizing && (e.currentTarget.style.opacity = 0)}
                  />
                  <div
                    onMouseDown={handleMouseDown}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: -4,
                      bottom: 0,
                      width: '8px',
                      background: 'rgba(99, 102, 241, 0.6)',
                      cursor: 'ew-resize',
                      opacity: isResizing ? 1 : 0,
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => !isResizing && (e.currentTarget.style.opacity = 0)}
                  />
                </div>
              </div>
              <div style={{
                marginTop: '0.75rem',
                textAlign: 'center',
                fontSize: '0.85rem',
                opacity: 0.6,
              }}>
                💡 Click and drag the image to resize
              </div>
            </div>
          )}
        </>
      )}

      {block.type === BLOCK_TYPES.AUDIO && (
        <>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => onUpdate(block.id, 'file', e.target.files?.[0] || null)}
          />
          {block.file && (
            <div style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.5rem' }}>
              ✅ {block.file.name}
            </div>
          )}
        </>
      )}

      {block.type === BLOCK_TYPES.DIVIDER && (
        <div style={{
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          margin: '0.5rem 0',
        }} />
      )}
    </div>
  );
}

// Helper functions
function getBlockIcon(type) {
  const icons = {
    text: '📝',
    image: '🖼️',
    video: '🎥',
    audio: '🎵',
    quote: '💬',
    divider: '➖',
  };
  return icons[type] || '📦';
}

function getBlockLabel(type) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// Styles
const blockButtonStyle = {
  padding: 'clamp(0.6rem, 1.5vw, 0.75rem) clamp(0.85rem, 2vw, 1rem)',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '8px',
  fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const controlButtonStyle = {
  padding: 'clamp(0.2rem, 1vw, 0.25rem) clamp(0.4rem, 1.5vw, 0.5rem)',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '6px',
  fontSize: 'clamp(0.75rem, 1.8vw, 0.85rem)',
  cursor: 'pointer',
};

const textareaStyle = {
  width: '100%',
  padding: '0.75rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '8px',
  fontSize: '0.95rem',
  outline: 'none',
  resize: 'vertical',
  minHeight: '100px',
};

const selectStyle = {
  padding: '0.5rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '6px',
  fontSize: '0.9rem',
  outline: 'none',
  cursor: 'pointer',
};
