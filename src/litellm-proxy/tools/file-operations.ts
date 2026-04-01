/**
 * File Operations Tool
 * Handle file operations in browser environment using localStorage/IndexedDB
 */

import type { UnifiedTool } from '../types';
import { createTool } from '../tool-mapper';

interface FileEntry {
  name: string;
  path: string;
  content: string;
  type: 'file' | 'directory';
  size: number;
  createdAt: string;
  modifiedAt: string;
}

interface FileSystem {
  files: Map<string, FileEntry>;
}

// In-memory file system (persisted to localStorage if available)
const STORAGE_KEY = 'claude_fs';

/**
 * Initialize file system from storage
 */
function initFileSystem(): FileSystem {
  const fs: FileSystem = { files: new Map() };

  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        for (const [path, entry] of Object.entries(parsed)) {
          fs.files.set(path, entry as FileEntry);
        }
      }
    }
  } catch {
    // localStorage not available or corrupted
  }

  return fs;
}

/**
 * Save file system to storage
 */
function saveFileSystem(fs: FileSystem): void {
  try {
    if (typeof localStorage !== 'undefined') {
      const data: Record<string, FileEntry> = {};
      fs.files.forEach((entry, path) => {
        data[path] = entry;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    // localStorage not available
  }
}

// Global file system instance
let fileSystem: FileSystem | null = null;

function getFileSystem(): FileSystem {
  if (!fileSystem) {
    fileSystem = initFileSystem();
  }
  return fileSystem;
}

/**
 * Normalize path
 */
function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\//, '').replace(/\/$/, '');
}

/**
 * Get parent path
 */
function getParentPath(path: string): string {
  const parts = normalizePath(path).split('/');
  parts.pop();
  return parts.join('/');
}

/**
 * Read file contents
 */
async function readFile(args: Record<string, unknown>): Promise<unknown> {
  const path = normalizePath(String(args.path || ''));
  const fs = getFileSystem();

  const entry = fs.files.get(path);

  if (!entry) {
    return {
      success: false,
      error: `File not found: ${path}`,
    };
  }

  if (entry.type === 'directory') {
    return {
      success: false,
      error: `Path is a directory: ${path}`,
    };
  }

  return {
    success: true,
    path,
    content: entry.content,
    size: entry.size,
    modifiedAt: entry.modifiedAt,
  };
}

/**
 * Write file contents
 */
async function writeFile(args: Record<string, unknown>): Promise<unknown> {
  const path = normalizePath(String(args.path || ''));
  const content = String(args.content || '');
  const append = Boolean(args.append);
  const fs = getFileSystem();

  if (!path) {
    return { success: false, error: 'Path is required' };
  }

  const existing = fs.files.get(path);
  const now = new Date().toISOString();

  let finalContent = content;
  if (append && existing && existing.type === 'file') {
    finalContent = existing.content + content;
  }

  const entry: FileEntry = {
    name: path.split('/').pop() || path,
    path,
    content: finalContent,
    type: 'file',
    size: finalContent.length,
    createdAt: existing?.createdAt || now,
    modifiedAt: now,
  };

  fs.files.set(path, entry);
  saveFileSystem(fs);

  return {
    success: true,
    path,
    size: entry.size,
    action: existing ? 'updated' : 'created',
  };
}

/**
 * Delete file or directory
 */
async function deleteFile(args: Record<string, unknown>): Promise<unknown> {
  const path = normalizePath(String(args.path || ''));
  const recursive = Boolean(args.recursive);
  const fs = getFileSystem();

  const entry = fs.files.get(path);

  if (!entry) {
    return { success: false, error: `File not found: ${path}` };
  }

  // If directory and recursive, delete all children
  if (entry.type === 'directory' && recursive) {
    const toDelete: string[] = [path];
    fs.files.forEach((_, filePath) => {
      if (filePath.startsWith(path + '/')) {
        toDelete.push(filePath);
      }
    });

    for (const p of toDelete) {
      fs.files.delete(p);
    }

    saveFileSystem(fs);
    return { success: true, deleted: toDelete.length };
  }

  fs.files.delete(path);
  saveFileSystem(fs);

  return { success: true, path };
}

/**
 * List directory contents
 */
async function listDirectory(args: Record<string, unknown>): Promise<unknown> {
  const path = normalizePath(String(args.path || ''));
  const recursive = Boolean(args.recursive);
  const fs = getFileSystem();

  const entries: FileEntry[] = [];
  const prefix = path ? path + '/' : '';

  fs.files.forEach((entry, filePath) => {
    if (recursive) {
      if (filePath.startsWith(prefix) || !path) {
        entries.push(entry);
      }
    } else {
      const relativePath = filePath.replace(prefix, '');
      if (
        (filePath.startsWith(prefix) || !path) &&
        !relativePath.includes('/')
      ) {
        entries.push(entry);
      }
    }
  });

  return {
    success: true,
    path: path || '/',
    entries: entries.map((e) => ({
      name: e.name,
      path: e.path,
      type: e.type,
      size: e.size,
      modifiedAt: e.modifiedAt,
    })),
    count: entries.length,
  };
}

/**
 * Create directory
 */
async function createDirectory(args: Record<string, unknown>): Promise<unknown> {
  const path = normalizePath(String(args.path || ''));
  const fs = getFileSystem();

  if (!path) {
    return { success: false, error: 'Path is required' };
  }

  const existing = fs.files.get(path);
  if (existing) {
    if (existing.type === 'directory') {
      return { success: true, message: 'Directory already exists' };
    }
    return { success: false, error: 'Path exists as a file' };
  }

  const now = new Date().toISOString();
  const entry: FileEntry = {
    name: path.split('/').pop() || path,
    path,
    content: '',
    type: 'directory',
    size: 0,
    createdAt: now,
    modifiedAt: now,
  };

  fs.files.set(path, entry);
  saveFileSystem(fs);

  return { success: true, path };
}

/**
 * Copy file or directory
 */
async function copyFile(args: Record<string, unknown>): Promise<unknown> {
  const source = normalizePath(String(args.source || ''));
  const destination = normalizePath(String(args.destination || ''));
  const fs = getFileSystem();

  const entry = fs.files.get(source);
  if (!entry) {
    return { success: false, error: `Source not found: ${source}` };
  }

  const now = new Date().toISOString();
  const newEntry: FileEntry = {
    ...entry,
    name: destination.split('/').pop() || destination,
    path: destination,
    createdAt: now,
    modifiedAt: now,
  };

  fs.files.set(destination, newEntry);
  saveFileSystem(fs);

  return { success: true, source, destination };
}

/**
 * Move/rename file
 */
async function moveFile(args: Record<string, unknown>): Promise<unknown> {
  const source = normalizePath(String(args.source || ''));
  const destination = normalizePath(String(args.destination || ''));
  const fs = getFileSystem();

  const entry = fs.files.get(source);
  if (!entry) {
    return { success: false, error: `Source not found: ${source}` };
  }

  const now = new Date().toISOString();
  const newEntry: FileEntry = {
    ...entry,
    name: destination.split('/').pop() || destination,
    path: destination,
    modifiedAt: now,
  };

  fs.files.delete(source);
  fs.files.set(destination, newEntry);
  saveFileSystem(fs);

  return { success: true, source, destination };
}

/**
 * Search files by pattern
 */
async function searchFiles(args: Record<string, unknown>): Promise<unknown> {
  const pattern = String(args.pattern || '');
  const path = normalizePath(String(args.path || ''));
  const contentSearch = Boolean(args.content);
  const fs = getFileSystem();

  const matches: FileEntry[] = [];
  const regex = new RegExp(pattern, 'i');

  fs.files.forEach((entry) => {
    if (path && !entry.path.startsWith(path)) return;

    const nameMatch = regex.test(entry.name);
    const contentMatch = contentSearch && entry.type === 'file' && regex.test(entry.content);

    if (nameMatch || contentMatch) {
      matches.push(entry);
    }
  });

  return {
    success: true,
    pattern,
    matches: matches.map((e) => ({
      name: e.name,
      path: e.path,
      type: e.type,
    })),
    count: matches.length,
  };
}

// Create tools
export const readFileTool: UnifiedTool = createTool(
  'read_file',
  'Read the contents of a file',
  {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the file to read',
      },
    },
    required: ['path'],
  },
  readFile
);

export const writeFileTool: UnifiedTool = createTool(
  'write_file',
  'Write content to a file (creates if not exists)',
  {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the file',
      },
      content: {
        type: 'string',
        description: 'Content to write',
      },
      append: {
        type: 'boolean',
        description: 'Append to existing content instead of overwriting',
      },
    },
    required: ['path', 'content'],
  },
  writeFile
);

export const deleteFileTool: UnifiedTool = createTool(
  'delete_file',
  'Delete a file or directory',
  {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to delete',
      },
      recursive: {
        type: 'boolean',
        description: 'Delete directory contents recursively',
      },
    },
    required: ['path'],
  },
  deleteFile
);

export const listDirectoryTool: UnifiedTool = createTool(
  'list_directory',
  'List contents of a directory',
  {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Directory path (empty for root)',
      },
      recursive: {
        type: 'boolean',
        description: 'List contents recursively',
      },
    },
    required: [],
  },
  listDirectory
);

export const createDirectoryTool: UnifiedTool = createTool(
  'create_directory',
  'Create a new directory',
  {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Directory path to create',
      },
    },
    required: ['path'],
  },
  createDirectory
);

export const copyFileTool: UnifiedTool = createTool(
  'copy_file',
  'Copy a file or directory to a new location',
  {
    type: 'object',
    properties: {
      source: {
        type: 'string',
        description: 'Source path',
      },
      destination: {
        type: 'string',
        description: 'Destination path',
      },
    },
    required: ['source', 'destination'],
  },
  copyFile
);

export const moveFileTool: UnifiedTool = createTool(
  'move_file',
  'Move or rename a file',
  {
    type: 'object',
    properties: {
      source: {
        type: 'string',
        description: 'Source path',
      },
      destination: {
        type: 'string',
        description: 'Destination path',
      },
    },
    required: ['source', 'destination'],
  },
  moveFile
);

export const searchFilesTool: UnifiedTool = createTool(
  'search_files',
  'Search for files by name pattern',
  {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Search pattern (regex supported)',
      },
      path: {
        type: 'string',
        description: 'Directory to search in',
      },
      content: {
        type: 'boolean',
        description: 'Also search in file contents',
      },
    },
    required: ['pattern'],
  },
  searchFiles
);

// Export all file tools
export const fileTools = [
  readFileTool,
  writeFileTool,
  deleteFileTool,
  listDirectoryTool,
  createDirectoryTool,
  copyFileTool,
  moveFileTool,
  searchFilesTool,
];

export default fileTools;
