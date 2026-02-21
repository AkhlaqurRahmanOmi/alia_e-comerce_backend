import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { UserAddress } from '@prisma/client';
import { UserAddressRepository } from '../repositories/user-address.repository';
import { CreateAddressDto } from '../dtos/create-address.dto';
import { UpdateAddressDto } from '../dtos/update-address.dto';

@Injectable()
export class UserAddressProvider {
  constructor(private readonly addressRepository: UserAddressRepository) {}

  async createAddress(
    userId: number,
    dto: CreateAddressDto,
  ): Promise<UserAddress> {
    // If setting as default billing, clear existing default
    if (dto.isDefaultBilling) {
      await this.addressRepository.clearDefaultBilling(userId);
    }

    // If setting as default shipping, clear existing default
    if (dto.isDefaultShipping) {
      await this.addressRepository.clearDefaultShipping(userId);
    }

    // Create the address
    const address = await this.addressRepository.create(userId, dto);

    return address;
  }

  async getUserAddresses(userId: number): Promise<UserAddress[]> {
    return this.addressRepository.findByUserId(userId);
  }

  async getAddressById(id: number, userId: number): Promise<UserAddress> {
    const address = await this.addressRepository.findByIdAndUserId(id, userId);

    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    if (!address.isActive) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    return address;
  }

  async updateAddress(
    id: number,
    userId: number,
    dto: UpdateAddressDto,
  ): Promise<UserAddress> {
    // Verify address exists and belongs to user
    const existingAddress = await this.addressRepository.findByIdAndUserId(
      id,
      userId,
    );

    if (!existingAddress) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    if (!existingAddress.isActive) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    // If setting as default billing, clear existing default
    if (dto.isDefaultBilling && !existingAddress.isDefaultBilling) {
      await this.addressRepository.clearDefaultBilling(userId);
    }

    // If setting as default shipping, clear existing default
    if (dto.isDefaultShipping && !existingAddress.isDefaultShipping) {
      await this.addressRepository.clearDefaultShipping(userId);
    }

    // Update the address
    const updatedAddress = await this.addressRepository.update(id, dto);

    return updatedAddress;
  }

  async deleteAddress(id: number, userId: number): Promise<void> {
    // Verify address exists and belongs to user
    const address = await this.addressRepository.findByIdAndUserId(id, userId);

    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    if (!address.isActive) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    // Soft delete the address
    await this.addressRepository.delete(id);
  }

  async setDefaultBilling(id: number, userId: number): Promise<UserAddress> {
    // Verify address exists and belongs to user
    const address = await this.addressRepository.findByIdAndUserId(id, userId);

    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    if (!address.isActive) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    // Clear existing default
    await this.addressRepository.clearDefaultBilling(userId);

    // Set as default
    return this.addressRepository.update(id, { isDefaultBilling: true });
  }

  async setDefaultShipping(id: number, userId: number): Promise<UserAddress> {
    // Verify address exists and belongs to user
    const address = await this.addressRepository.findByIdAndUserId(id, userId);

    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    if (!address.isActive) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    // Clear existing default
    await this.addressRepository.clearDefaultShipping(userId);

    // Set as default
    return this.addressRepository.update(id, { isDefaultShipping: true });
  }
}
