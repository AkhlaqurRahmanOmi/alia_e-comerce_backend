import {
  BadRequestException,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import {Auth} from "./auth/decorator/auth.decorator";
import {AuthType} from "./auth/enums/auth-type.enum";
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { LocalFileStorageService } from './shared/services/local-file-storage.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly localFileStorageService: LocalFileStorageService) {}

    @Auth(AuthType.None)
  @Get('/')
  getHello(): string {
    return this.appService.getHello();
  }

  @Auth(AuthType.None)
  @Post('/test-local-upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Test local file upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Local file upload successful' })
  @ApiResponse({ status: 400, description: 'No file provided or upload failed' })
  async testLocalUpload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      const result = await this.localFileStorageService.uploadFile(file, 'test');
      return {
        message: 'Local file upload successful!',
        uploadResult: result,
      };
    } catch (error) {
      throw new BadRequestException(`Local file upload failed: ${error.message}`);
    }
  }
}
