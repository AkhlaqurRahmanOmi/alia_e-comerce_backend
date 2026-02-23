import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Segment } from '@/generated/prisma/client';
import { SegmentRepository } from '../repositories';
import { PrismaService } from '@/core/config/prisma/prisma.service';
import { CreateSegmentDto, UpdateSegmentDto } from '../dtos';

@Injectable()
export class SegmentManagementProvider {
  constructor(
    private readonly segmentRepository: SegmentRepository,
    private readonly prisma: PrismaService,
  ) {}

  async createSegment(data: CreateSegmentDto): Promise<Segment> {
    const existingSegment = await this.segmentRepository.findByKey(data.key);
    if (existingSegment) {
      throw new ConflictException(`Segment with key '${data.key}' already exists`);
    }

    return this.segmentRepository.create({
      key: data.key,
      name: data.name,
      isActive: data.isActive ?? true,
      position: data.position ?? 0,
    });
  }

  async updateSegment(id: number, data: UpdateSegmentDto): Promise<Segment> {
    const existingSegment = await this.segmentRepository.findById(id);
    if (!existingSegment) {
      throw new NotFoundException(`Segment with ID ${id} not found`);
    }

    if (data.key && data.key !== existingSegment.key) {
      const keyConflict = await this.segmentRepository.findByKey(data.key);
      if (keyConflict && keyConflict.id !== id) {
        throw new ConflictException(`Segment with key '${data.key}' already exists`);
      }
    }

    return this.segmentRepository.update(id, data);
  }

  async deleteSegment(id: number): Promise<void> {
    const segment = await this.segmentRepository.findById(id);
    if (!segment) {
      throw new NotFoundException(`Segment with ID ${id} not found`);
    }

    const assignedProducts = await this.prisma.productSegment.count({
      where: { segmentId: id },
    });

    if (assignedProducts > 0) {
      throw new BadRequestException(
        `Cannot delete segment with ${assignedProducts} assigned products`,
      );
    }

    await this.segmentRepository.delete(id);
  }

  async getSegmentById(id: number): Promise<Segment> {
    const segment = await this.segmentRepository.findById(id);
    if (!segment) {
      throw new NotFoundException(`Segment with ID ${id} not found`);
    }

    return segment;
  }

  async getAllSegments(): Promise<Segment[]> {
    return this.segmentRepository.findAll();
  }

  async getActiveSegments(): Promise<Segment[]> {
    return this.segmentRepository.findActive();
  }

  async searchSegments(query: string): Promise<Segment[]> {
    if (!query?.trim()) {
      return this.segmentRepository.findAll();
    }

    return this.segmentRepository.search(query, ['name', 'key']);
  }
}
