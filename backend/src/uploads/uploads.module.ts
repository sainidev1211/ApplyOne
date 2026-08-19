import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { memoryStorage } from 'multer';

/**
 * UploadsModule — uses memoryStorage so uploaded files are available as
 * file.buffer in the request handler. The ResumeService persists the binary
 * data directly inside the MongoDB document (StoredResume.fileData: Buffer).
 * No local disk paths are involved, making the service portable across
 * deployments without a shared filesystem.
 */
@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const maxSizeMb = configService.get<number>('app.maxUploadSizeMb', 10);
        return {
          storage: memoryStorage(),
          limits: {
            fileSize: maxSizeMb * 1024 * 1024,
          },
          fileFilter: (
            _req,
            file: Express.Multer.File,
            callback: (error: Error | null, acceptFile: boolean) => void,
          ) => {
            const allowedMimeTypes = [
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'image/jpeg',
              'image/png',
              'image/webp',
            ];

            if (allowedMimeTypes.includes(file.mimetype)) {
              callback(null, true);
            } else {
              callback(
                new Error(`Unsupported file type: ${file.mimetype}`),
                false,
              );
            }
          },
        };
      },
    }),
  ],
  exports: [MulterModule],
})
export class UploadsModule {}
