import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GamificationService } from 'src/gamification/gamification.service';
import { SavedPlace } from 'src/saved/saved.entity';
import { User } from 'src/user/user.entity';
import { CreateCommentDto, PlaceCommentDto } from './place-comment.dto';
import { PlaceComment } from './place-comment.entity';

const MAX_BODY = 500;

interface PopulatedAuthor {
  _id: Types.ObjectId;
  name: string;
  publicSlug?: string;
}

@Injectable()
export class PlaceCommentService {
  constructor(
    @InjectModel(PlaceComment.name)
    private commentModel: Model<PlaceComment>,
    @InjectModel(SavedPlace.name)
    private savedPlaceModel: Model<SavedPlace>,
    @InjectModel(User.name) private userModel: Model<User>,
    private gamificationService: GamificationService,
  ) {}

  async listForSavedPlace(savedPlaceId: string): Promise<PlaceCommentDto[]> {
    await this.requirePublicOwner(savedPlaceId);
    const rows = await this.commentModel
      .find({ savedPlace: new Types.ObjectId(savedPlaceId) })
      .sort({ createdAt: 1 })
      .populate<{ author: PopulatedAuthor }>('author', 'name publicSlug')
      .exec();
    return rows
      .filter((r) => r.author)
      .map((r) => ({
        id: (r._id as Types.ObjectId).toString(),
        authorId: r.author._id.toString(),
        authorName: r.author.name,
        authorSlug: r.author.publicSlug,
        body: r.body,
        createdAt: r.createdAt,
      }));
  }

  async create(
    authorId: string,
    savedPlaceId: string,
    dto: CreateCommentDto,
  ): Promise<PlaceCommentDto> {
    const body = (dto.body ?? '').trim();
    if (!body) throw new BadRequestException('Comment cannot be empty');
    if (body.length > MAX_BODY) {
      throw new BadRequestException(
        `Comment must be at most ${MAX_BODY} characters`,
      );
    }

    const owner = await this.requirePublicOwner(savedPlaceId);

    const created = await this.commentModel.create({
      author: new Types.ObjectId(authorId),
      savedPlace: new Types.ObjectId(savedPlaceId),
      owner: owner._id,
      body,
    });

    if (authorId !== owner._id.toString()) {
      try {
        await this.gamificationService.award(authorId, 'comment_public');
      } catch {
        // never let gamification break the primary action
      }
    }

    const populated = await this.commentModel
      .findById(created._id)
      .populate<{ author: PopulatedAuthor }>('author', 'name publicSlug')
      .exec();
    if (!populated || !populated.author) {
      throw new NotFoundException('Comment not found');
    }
    return {
      id: (populated._id as Types.ObjectId).toString(),
      authorId: populated.author._id.toString(),
      authorName: populated.author.name,
      authorSlug: populated.author.publicSlug,
      body: populated.body,
      createdAt: populated.createdAt,
    };
  }

  async remove(actorId: string, commentId: string): Promise<void> {
    const c = await this.commentModel.findById(commentId);
    if (!c) throw new NotFoundException('Comment not found');
    const isAuthor = c.author.toString() === actorId;
    const isOwner = c.owner.toString() === actorId;
    if (!isAuthor && !isOwner) {
      throw new ForbiddenException('Cannot delete this comment');
    }
    await this.commentModel.deleteOne({ _id: c._id });
  }

  private async requirePublicOwner(
    savedPlaceId: string,
  ): Promise<{ _id: Types.ObjectId }> {
    if (!Types.ObjectId.isValid(savedPlaceId)) {
      throw new NotFoundException('Saved place not found');
    }
    const sp = await this.savedPlaceModel.findById(savedPlaceId);
    if (!sp) throw new NotFoundException('Saved place not found');
    const owner = await this.userModel.findById(sp.user);
    if (!owner || !owner.isPublic) {
      throw new NotFoundException('Saved place not found');
    }
    return { _id: owner._id as Types.ObjectId };
  }
}
