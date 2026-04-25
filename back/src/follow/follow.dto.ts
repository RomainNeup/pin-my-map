import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'Is Following' })
export class IsFollowingDto {
  @ApiProperty()
  following: boolean;
}

@ApiSchema({ name: 'Follow User Summary' })
export class FollowUserDto {
  @ApiProperty()
  userId: string;
  @ApiProperty()
  name: string;
  @ApiProperty({ required: false })
  publicSlug?: string;
  @ApiProperty()
  isPublic: boolean;
  @ApiProperty()
  followedAt: Date;
}

@ApiSchema({ name: 'Follow Stats' })
export class FollowStatsDto {
  @ApiProperty()
  followerCount: number;
  @ApiProperty()
  followingCount: number;
  @ApiProperty()
  isFollowing: boolean;
}
