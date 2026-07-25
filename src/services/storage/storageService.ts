import { IStorageService, ServiceResponse } from '@/types/services';

class SupabaseStorageService implements IStorageService {
  async uploadFile(
    bucket: string,
    path: string,
    file: File
  ): Promise<ServiceResponse<{ url: string }>> {
    try {
      console.log(`[STORAGE]: Uploading ${file.name} to bucket: ${bucket}, path: ${path}`);
      // Mock delay to simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 800));

      return {
        success: true,
        data: { url: `https://storage.applyone.co/${bucket}/${path}` },
        error: null,
        message: 'File uploaded successfully.',
      };
    } catch (err: any) {
      return {
        success: false,
        data: null,
        error: err.message || 'An error occurred during file upload.',
        message: 'Upload failed.',
      };
    }
  }

  async downloadFile(bucket: string, path: string): Promise<ServiceResponse<{ blob: Blob }>> {
    try {
      console.log(`[STORAGE]: Downloading from bucket: ${bucket}, path: ${path}`);
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        success: true,
        data: { blob: new Blob(['mock content'], { type: 'application/pdf' }) },
        error: null,
        message: 'File downloaded successfully.',
      };
    } catch (err: any) {
      return {
        success: false,
        data: null,
        error: err.message || 'An error occurred during file download.',
        message: 'Download failed.',
      };
    }
  }

  async deleteFile(bucket: string, path: string): Promise<ServiceResponse<void>> {
    try {
      console.log(`[STORAGE]: Deleting from bucket: ${bucket}, path: ${path}`);
      await new Promise((resolve) => setTimeout(resolve, 400));

      return {
        success: true,
        data: null,
        error: null,
        message: 'File deleted successfully.',
      };
    } catch (err: any) {
      return {
        success: false,
        data: null,
        error: err.message || 'An error occurred during file deletion.',
        message: 'Deletion failed.',
      };
    }
  }
}

export const storageService: IStorageService = new SupabaseStorageService();
