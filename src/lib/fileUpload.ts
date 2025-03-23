import { v4 as uuidv4 } from 'uuid';

type FileType = 'image' | 'csv' | 'document';

interface UploadedFile {
  originalName: string;
  fileName: string;
  path: string;
  type: FileType;
  size: number;
}

const getFileType = (file: File): FileType => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'text/csv') return 'csv';
  return 'document';
};

const getUploadDir = (type: FileType): string => {
  const baseDir = '/public/uploads';
  switch (type) {
    case 'image':
      return `${baseDir}/images`;
    case 'csv':
      return `${baseDir}/csv`;
    case 'document':
      return `${baseDir}/documents`;
  }
};

export const uploadFile = async (file: File): Promise<UploadedFile> => {
  const type = getFileType(file);
  const extension = file.name.split('.').pop() || '';
  const fileName = `${uuidv4()}.${extension}`;
  const uploadDir = getUploadDir(type);
  const path = `${uploadDir}/${fileName}`;

  try {
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Validate file type
    if (type === 'image' && !file.type.startsWith('image/')) {
      throw new Error('Invalid image file type');
    } else if (type === 'csv' && file.type !== 'text/csv') {
      throw new Error('Invalid CSV file type');
    }

    // Create FormData and append file
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    // Send file to server
    const response = await fetch('http://localhost:3001/api/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to upload file');
    }

    return {
      originalName: file.name,
      fileName,
      path: result.path || path,
      type,
      size: file.size
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error instanceof Error ? error : new Error('Failed to upload file');
  }
};

export const deleteFile = async (path: string): Promise<void> => {
  try {
    const response = await fetch(`/api/upload?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete file');
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error instanceof Error ? error : new Error('Failed to delete file');
  }
};

export const getFileUrl = (path: string): string => {
  // Return the full URL for the file
  return `${window.location.origin}${path}`;
};