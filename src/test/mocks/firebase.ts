import { vi } from "vitest";

// ─── Firestore mock ───────────────────────────────────────────────────────────

export const mockDocData: Record<string, unknown> = {};
export const mockCollectionDocs: Record<string, unknown[]> = {};

export const mockServerTimestamp = () => ({ _type: "serverTimestamp" });

export const mockGetDoc = vi.fn(async (ref: { id: string; path: string }) => ({
  id: ref.id,
  exists: () => Boolean(mockDocData[ref.path]),
  data: () => mockDocData[ref.path] ?? null,
}));

export const mockSetDoc = vi.fn(async () => undefined);
export const mockUpdateDoc = vi.fn(async () => undefined);
export const mockDeleteDoc = vi.fn(async () => undefined);
export const mockAddDoc = vi.fn(async () => ({ id: "mock-doc-id" }));

export const mockGetDocs = vi.fn(async (q: unknown) => ({
  docs: (mockCollectionDocs[(q as { _collection: string })._collection] ?? []).map(
    (d: unknown) => ({
      id: (d as { id: string }).id,
      data: () => d,
    })
  ),
}));

export const mockGetCountFromServer = vi.fn(async () => ({
  data: () => ({ count: 0 }),
}));

export const mockDoc = vi.fn((db: unknown, collection: string, id: string) => ({
  id,
  path: `${collection}/${id}`,
}));

export const mockCollection = vi.fn((db: unknown, name: string) => ({
  _collection: name,
}));

export const mockQuery = vi.fn((...args: unknown[]) => args[0]);
export const mockWhere = vi.fn();

// writeBatch mock
const mockBatchUpdate = vi.fn();
const mockBatchSet = vi.fn();
const mockBatchDelete = vi.fn();
const mockBatchCommit = vi.fn(async () => undefined);
export const mockWriteBatch = vi.fn(() => ({
  update: mockBatchUpdate,
  set: mockBatchSet,
  delete: mockBatchDelete,
  commit: mockBatchCommit,
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => ({})),
  doc: mockDoc,
  collection: mockCollection,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  addDoc: mockAddDoc,
  serverTimestamp: mockServerTimestamp,
  query: mockQuery,
  where: mockWhere,
  getCountFromServer: mockGetCountFromServer,
  writeBatch: mockWriteBatch,
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  FieldValue: { serverTimestamp: mockServerTimestamp },
}));

// ─── Firebase Auth mock ───────────────────────────────────────────────────────

export const mockUser = {
  uid: "user-123",
  email: "test@example.com",
  displayName: "Torcedor Teste",
  emailVerified: true,
};

export const mockSignInWithEmailAndPassword = vi.fn(async () => ({
  user: mockUser,
}));

export const mockCreateUserWithEmailAndPassword = vi.fn(async () => ({
  user: { ...mockUser, uid: "new-user-456" },
}));

export const mockSignInWithPopup = vi.fn(async () => ({
  user: { ...mockUser, uid: "google-user-789" },
}));

export const mockSignOut = vi.fn(async () => undefined);
export const mockUpdateProfile = vi.fn(async () => undefined);

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  signInWithPopup: mockSignInWithPopup,
  signOut: mockSignOut,
  updateProfile: mockUpdateProfile,
  GoogleAuthProvider: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(),
}));

// ─── Firebase Storage mock ────────────────────────────────────────────────────

export const mockUploadBytes = vi.fn(async () => ({}));
export const mockGetDownloadURL = vi.fn(async () => "https://example.com/avatar.png");
export const mockRef = vi.fn(() => ({ fullPath: "avatars/test/file.png" }));

vi.mock("firebase/storage", () => ({
  getStorage: vi.fn(() => ({})),
  ref: mockRef,
  uploadBytes: mockUploadBytes,
  getDownloadURL: mockGetDownloadURL,
}));

// ─── Firebase client integration mock ────────────────────────────────────────

vi.mock("@/integrations/firebase/client", () => ({
  db: {},
  auth: {},
  storage: {},
  default: {},
}));

export function resetFirebaseMocks() {
  mockGetDoc.mockClear();
  mockSetDoc.mockClear();
  mockUpdateDoc.mockClear();
  mockDeleteDoc.mockClear();
  mockAddDoc.mockClear();
  mockGetDocs.mockClear();
  mockSignInWithEmailAndPassword.mockClear();
  mockCreateUserWithEmailAndPassword.mockClear();
  mockSignInWithPopup.mockClear();
  mockSignOut.mockClear();
  mockUpdateProfile.mockClear();
  mockUploadBytes.mockClear();
  mockGetDownloadURL.mockClear();
  Object.keys(mockDocData).forEach((k) => delete mockDocData[k]);
  Object.keys(mockCollectionDocs).forEach((k) => delete mockCollectionDocs[k]);
}
