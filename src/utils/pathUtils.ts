import * as path from 'path';
import * as fs from 'fs';

export class PathUtils {
    static normalizeFilePath(filePath: string): string {
        return filePath.split(path.sep).join(path.posix.sep);
    }

    static getFileExtension(filePath: string): string {
        return path.extname(filePath).toLowerCase();
    }

    static isPluginFile(fileName: string): boolean {
        const ext = this.getFileExtension(fileName);
        return ext === '.dll' || ext === '.so';
    }

    static isIncludeFile(fileName: string): boolean {
        return this.getFileExtension(fileName) === '.inc';
    }

    static async writeFileAsync(filePath: string, data: Buffer): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, data, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    static async readFileAsync(filePath: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }
} 