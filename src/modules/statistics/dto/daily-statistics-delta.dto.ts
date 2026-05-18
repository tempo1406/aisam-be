export class DailyStatisticsDeltaDto {
  socialAccountId: string;
  pageName: string;
  date: string;
  newPosts: number;
  newLikes: number;
  newComments: number;
  newShares: number;
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  topPosts: Array<{
    postId: string;
    message: string;
    likesGained: number;
    commentsGained: number;
    sharesGained: number;
  }>;
}
