import * as fs from 'fs';
import * as path from 'path';
import { PathUtils } from '../utils/pathUtils';

export class FileSystemService {
    static async ensureDirectory(dirPath: string): Promise<void> {
        if (!fs.existsSync(dirPath)) {
            await fs.promises.mkdir(dirPath, { recursive: true });
        }
    }

    static async saveFile(filePath: string, content: Buffer, append: boolean = false): Promise<void> {
        const directory = path.dirname(filePath);
        await this.ensureDirectory(directory);
        
        if (append) {
            await fs.promises.appendFile(filePath, content);
        } else {
            await PathUtils.writeFileAsync(filePath, content);
        }
    }

    static async readFile(filePath: string): Promise<Buffer> {
        return PathUtils.readFileAsync(filePath);
    }

    static async listFiles(dirPath: string): Promise<string[]> {
        try {
            const files = await fs.promises.readdir(dirPath);
            return files;
        } catch {
            return [];
        }
    }

    static async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.promises.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    static async deleteFile(filePath: string): Promise<void> {
        if (await this.fileExists(filePath)) {
            await fs.promises.unlink(filePath);
        }
    }

    static async copyFile(source: string, destination: string): Promise<void> {
        const directory = path.dirname(destination);
        await this.ensureDirectory(directory);
        await fs.promises.copyFile(source, destination);
    }
} 