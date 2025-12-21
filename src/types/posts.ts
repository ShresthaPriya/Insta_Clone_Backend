export interface CreatePostInput {
  userId: string;
  caption?: string;
  location?: string;
  urls: string[];
}


export interface CommentInput{
  postId: string;
  userId: string;
  text: string;
  parentCommentId?: string | null;
}