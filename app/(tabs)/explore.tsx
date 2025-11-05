import { IconSymbol } from '@/components/ui/icon-symbol';
import { QuiloxColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Comment {
  id: string;
  username: string;
  avatar: string;
  text: string;
  time: string;
}

export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const { feedPosts, loading } = useApp();
  const isDark = true;
  
  // State for comments per post
  const [postComments, setPostComments] = useState<{ [key: string]: Comment[] }>({
    // Initialize with existing comments for first post
    [feedPosts[0]?.id || 'default']: [
      {
        id: '1',
        username: 'djspinall',
        avatar: 'https://i.pravatar.cc/40?img=1',
        text: 'What an amazing set tonight! The energy was incredible 🔥',
        time: '1h',
      },
      {
        id: '2',
        username: 'lagospartyqueen',
        avatar: 'https://i.pravatar.cc/40?img=2',
        text: 'Best night ever! See you next Friday 💃',
        time: '45m',
      },
    ],
  });
  
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({});

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: QuiloxColors.black }]}>
        <ActivityIndicator size="large" color={QuiloxColors.gold} />
        <Text style={{ color: QuiloxColors.gold, marginTop: 10 }}>Loading feed...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity>
              <IconSymbol name="arrow.left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Feed</Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: QuiloxColors.gold }]}>Quilox Social</Text>
        </View>

      {/* Feed Posts */}
      {feedPosts.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol name="doc.text.image" size={48} color={QuiloxColors.gold} />
          <Text style={[styles.emptyText, { color: '#fff' }]}>No posts yet</Text>
          <Text style={[styles.emptySubtext, { color: '#999' }]}>Be the first to share something amazing!</Text>
        </View>
      ) : (
        feedPosts.map((post) => {
          console.log('Rendering post:', post);
          return (
            <View key={post.id} style={[styles.postCard, { backgroundColor: '#000000' }]}>
              {/* Post Header */}
              <View style={styles.postHeader}>
                <View style={styles.userInfo}>
                  <View style={[styles.avatar, { backgroundColor: QuiloxColors.gold }]}>
                    <Text style={styles.avatarText}>Q</Text>
                  </View>
                  <View style={styles.userDetails}>
                    <View style={styles.usernameRow}>
                      <Text style={[styles.username, { color: '#fff' }]}>quiloxlagos</Text>
                      <IconSymbol name="checkmark.seal.fill" size={14} color={QuiloxColors.gold} />
                    </View>
                    <Text style={[styles.location, { color: '#999' }]}>Quilox, Victoria Island</Text>
                  </View>
                </View>
                <View style={styles.postHeaderRight}>
                  <Text style={[styles.timeAgo, { color: '#999' }]}>2h</Text>
                  <TouchableOpacity>
                    <IconSymbol name="ellipsis" size={20} color="#999" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Post Image */}
              {post.image_url ? (
                <Image
                  source={{ uri: post.image_url }}
                  style={styles.postImage}
                  resizeMode="cover"
                  onError={(e) => console.log('Error loading image:', e.nativeEvent.error)}
                />
              ) : null}

              {/* Post Actions */}
              <View style={styles.postActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <IconSymbol name="heart" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <IconSymbol name="bubble.left" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <IconSymbol name="paperplane" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Likes */}
              <Text style={[styles.likes, { color: '#fff' }]}>247 likes</Text>

              {/* Caption */}
              <View style={styles.captionContainer}>
                <Text style={[styles.caption, { color: '#fff' }]}>
                  <Text style={styles.captionUsername}>quiloxlagos</Text>
                </Text>
              </View>

              {/* Comments */}
              {postComments[post.id] && postComments[post.id].length > 0 && (
                <View style={styles.commentsSection}>
                  {(expandedComments[post.id] 
                    ? postComments[post.id] 
                    : postComments[post.id].slice(0, 2)
                  ).map((comment) => (
                    <View key={comment.id} style={styles.comment}>
                      <Image 
                        source={{ uri: comment.avatar }} 
                        style={styles.commentAvatar}
                      />
                      <View style={styles.commentContent}>
                        <Text style={styles.commentText}>
                          <Text style={styles.commentUsername}>{comment.username}</Text>
                          <Text style={styles.commentTime}> {comment.time}</Text>
                        </Text>
                        <Text style={styles.commentBody}>{comment.text}</Text>
                      </View>
                    </View>
                  ))}
                  {postComments[post.id].length > 2 && (
                    <TouchableOpacity 
                      style={styles.viewAllComments}
                      onPress={() => {
                        setExpandedComments({
                          ...expandedComments,
                          [post.id]: !expandedComments[post.id]
                        });
                      }}
                    >
                      <Text style={[styles.viewAllCommentsText, { color: '#666' }]}>
                        {expandedComments[post.id] 
                          ? 'Show less' 
                          : `View all ${postComments[post.id].length} comments`
                        }
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Add Comment */}
              <View style={styles.addCommentContainer}>
                <Image 
                  source={{ uri: 'https://i.pravatar.cc/40?img=3' }} 
                  style={styles.commentAvatar}
                />
                {activeCommentPostId === post.id ? (
                  <View style={styles.commentInputContainer}>
                    <TextInput
                      style={[styles.commentInput, { color: '#fff' }]}
                      placeholder="Add a comment..."
                      placeholderTextColor="#666"
                      value={commentInputs[post.id] || ''}
                      onChangeText={(text) => setCommentInputs({ ...commentInputs, [post.id]: text })}
                      autoFocus
                      multiline
                      onBlur={() => {
                        if (!commentInputs[post.id]?.trim()) {
                          setActiveCommentPostId(null);
                        }
                      }}
                    />
                    <TouchableOpacity
                      style={styles.postCommentButton}
                      onPress={() => {
                        const commentText = commentInputs[post.id]?.trim();
                        if (commentText) {
                          const newComment: Comment = {
                            id: Date.now().toString(),
                            username: 'You',
                            avatar: 'https://i.pravatar.cc/40?img=3',
                            text: commentText,
                            time: 'Just now',
                          };
                          setPostComments({
                            ...postComments,
                            [post.id]: [...(postComments[post.id] || []), newComment],
                          });
                          setCommentInputs({ ...commentInputs, [post.id]: '' });
                          setActiveCommentPostId(null);
                        }
                      }}
                    >
                      <Text style={[styles.postCommentButtonText, { color: QuiloxColors.gold }]}>Post</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.addCommentTouchable}
                    onPress={() => setActiveCommentPostId(post.id)}
                  >
                    <Text style={[styles.addCommentText, { color: '#666' }]}>Add a comment...</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  postImage: {
    width: '100%',
    height: 375,
    backgroundColor: QuiloxColors.mediumGray,
    marginTop: 12,
    borderRadius: 0,
  },
  imagePlaceholder: {
    width: '100%',
    height: 375,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: QuiloxColors.mediumGray,
    borderRadius: 0,
    marginTop: 12,
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  postCard: {
    width: '100%',
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#000000',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  postHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userDetails: {
    gap: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: QuiloxColors.black,
    fontSize: 14,
    fontWeight: 'bold',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  username: {
    fontSize: 13,
    fontWeight: '600',
  },
  location: {
    fontSize: 11,
    color: '#999',
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
  },
  postImage: {
    width: '100%',
    height: 500,
    backgroundColor: '#000',
  },
  postActions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 16,
  },
  actionButton: {
    padding: 0,
  },
  likes: {
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    color: '#fff',
  },
  captionContainer: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  caption: {
    fontSize: 13,
    color: '#fff',
  },
  captionUsername: {
    fontWeight: '600',
    color: '#fff',
  },
  commentsSection: {
    paddingHorizontal: 12,
    gap: 12,
    marginBottom: 12,
  },
  comment: {
    flexDirection: 'row',
    gap: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentContent: {
    flex: 1,
    gap: 2,
  },
  commentText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentUsername: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  commentTime: {
    fontSize: 12,
    color: '#666',
  },
  commentBody: {
    fontSize: 13,
    color: '#fff',
    lineHeight: 18,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  addCommentTouchable: {
    flex: 1,
  },
  addCommentText: {
    fontSize: 13,
    color: '#666',
  },
  commentInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentInput: {
    flex: 1,
    fontSize: 13,
    maxHeight: 100,
  },
  postCommentButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  postCommentButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  viewAllComments: {
    paddingVertical: 4,
  },
  viewAllCommentsText: {
    fontSize: 13,
  },
});
