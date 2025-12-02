import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  UploadTask,
  UploadTaskSnapshot,
} from 'firebase/storage';
import { storage } from '../config/firebase';

// Storage paths based on PRD requirements
export const STORAGE_PATHS = {
  PROFILE_IMAGES: 'profileImages',
  LAWYER_DOCUMENTS: 'lawyerDocuments', // Verification docs (Bar ID, License)
  CASE_DOCUMENTS: 'caseDocuments',
  CONSULTATION_RECORDINGS: 'consultationRecordings',
} as const;

// Upload file and get download URL
export const uploadFile = async (
  path: string,
  file: Blob | Uint8Array | ArrayBuffer,
  fileName: string
): Promise<string> => {
  try {
    const fileRef = ref(storage, `${path}/${fileName}`);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  } catch (error) {
    throw error;
  }
};

// Upload with progress tracking
export const uploadFileWithProgress = (
  path: string,
  file: Blob | Uint8Array | ArrayBuffer,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileRef = ref(storage, `${path}/${fileName}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

// Upload profile image
export const uploadProfileImage = async (
  userId: string,
  file: Blob | Uint8Array | ArrayBuffer,
  fileExtension: string = 'jpg'
): Promise<string> => {
  const fileName = `${userId}_${Date.now()}.${fileExtension}`;
  return uploadFile(STORAGE_PATHS.PROFILE_IMAGES, file, fileName);
};

// Upload lawyer verification document
export const uploadLawyerDocument = async (
  lawyerId: string,
  documentType: 'barId' | 'license' | 'cnic' | 'education',
  file: Blob | Uint8Array | ArrayBuffer,
  fileExtension: string = 'pdf'
): Promise<string> => {
  const fileName = `${lawyerId}/${documentType}_${Date.now()}.${fileExtension}`;
  return uploadFile(STORAGE_PATHS.LAWYER_DOCUMENTS, file, fileName);
};

// Upload case document
export const uploadCaseDocument = async (
  caseId: string,
  file: Blob | Uint8Array | ArrayBuffer,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const uniqueFileName = `${caseId}/${Date.now()}_${fileName}`;
  return uploadFileWithProgress(
    STORAGE_PATHS.CASE_DOCUMENTS,
    file,
    uniqueFileName,
    onProgress
  );
};

// Get download URL for existing file
export const getFileURL = async (path: string): Promise<string> => {
  try {
    const fileRef = ref(storage, path);
    return await getDownloadURL(fileRef);
  } catch (error) {
    throw error;
  }
};

// Delete file
export const deleteFile = async (path: string): Promise<void> => {
  try {
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
  } catch (error) {
    throw error;
  }
};

// List all files in a folder
export const listFiles = async (path: string): Promise<string[]> => {
  try {
    const folderRef = ref(storage, path);
    const result = await listAll(folderRef);
    const urls = await Promise.all(
      result.items.map(item => getDownloadURL(item))
    );
    return urls;
  } catch (error) {
    throw error;
  }
};
