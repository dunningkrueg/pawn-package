import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import AdmZip = require('adm-zip');
import { FileSystemService } from './fileSystem';
import { PathUtils } from '../utils/pathUtils';

export class AlternativeDownloader {
    async downloadBinaryDirect(url: string, pluginsPath: string): Promise<void> {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const fileName = path.basename(url);
            await FileSystemService.saveFile(path.join(pluginsPath, fileName), Buffer.from(response.data));
        } catch (error) {
            throw new Error(`Failed to download binary: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async downloadAndExtractArchive(url: string, pluginsPath: string, includePath: string): Promise<void> {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const zip = new AdmZip(Buffer.from(response.data));
            const entries = zip.getEntries();

            for (const entry of entries) {
                const entryName = entry.entryName;
                const fileBuffer = entry.getData();

                if (PathUtils.isPluginFile(entryName)) {
                    const fileName = path.basename(entryName);
                    await FileSystemService.saveFile(path.join(pluginsPath, fileName), fileBuffer);
                } else if (PathUtils.isIncludeFile(entryName)) {
                    const fileName = path.basename(entryName);
                    await FileSystemService.saveFile(path.join(includePath, fileName), fileBuffer);
                }
            }
        } catch (error) {
            throw new Error(`Failed to process archive: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async downloadFromDirectLink(url: string, pluginsPath: string, includePath: string): Promise<void> {
        const fileExtension = path.extname(url).toLowerCase();

        switch (fileExtension) {
            case '.dll':
            case '.so':
                await this.downloadBinaryDirect(url, pluginsPath);
                break;

            case '.zip':
            case '.rar':
                await this.downloadAndExtractArchive(url, pluginsPath, includePath);
                break;

            default:
                throw new Error(`Unsupported file type: ${fileExtension}`);
        }
    }

    async downloadFromMirror(pluginName: string, pluginsPath: string): Promise<void> {
        const mirrors = [
            `https://files.sa-mp.com/plugins/${pluginName}`,
            `https://assets.open.mp/plugins/${pluginName}`,
            `https://github.com/samp-plugins-mirror/plugins/raw/main/${pluginName}`
        ];

        for (const mirror of mirrors) {
            try {
                await this.downloadBinaryDirect(mirror, pluginsPath);
                return;
            } catch {
                continue;
            }
        }

        throw new Error(`Failed to download ${pluginName} from all mirrors`);
    }

    async downloadFromCustomSource(input: string, pluginsPath: string, includePath: string): Promise<void> {
        if (input.startsWith('http://') || input.startsWith('https://')) {
            await this.downloadFromDirectLink(input, pluginsPath, includePath);
        } else {
            const possibleUrls = [
                `https://github.com/${input}/releases/latest/download/plugin.zip`,
                `https://github.com/${input}/archive/refs/heads/main.zip`,
                `https://raw.githubusercontent.com/${input}/main/plugin.dll`,
                `https://raw.githubusercontent.com/${input}/main/plugin.so`
            ];

            for (const url of possibleUrls) {
                try {
                    await this.downloadFromDirectLink(url, pluginsPath, includePath);
                    return;
                } catch {
                    continue;
                }
            }

            await this.downloadFromMirror(input, pluginsPath);
        }
    }

    async scanAndOrganizeFiles(sourcePath: string, pluginsPath: string, includePath: string): Promise<void> {
        const files = await fs.promises.readdir(sourcePath);

        for (const file of files) {
            const filePath = path.join(sourcePath, file);
            const stat = await fs.promises.stat(filePath);

            if (stat.isFile()) {
                const fileBuffer = await fs.promises.readFile(filePath);

                if (PathUtils.isPluginFile(file)) {
                    await FileSystemService.saveFile(path.join(pluginsPath, file), fileBuffer);
                    await fs.promises.unlink(filePath);
                } else if (PathUtils.isIncludeFile(file)) {
                    await FileSystemService.saveFile(path.join(includePath, file), fileBuffer);
                    await fs.promises.unlink(filePath);
                }
            } else if (stat.isDirectory()) {
                await this.scanAndOrganizeFiles(filePath, pluginsPath, includePath);
                try {
                    await fs.promises.rmdir(filePath);
                } catch {
                    // Directory might not be empty
                }
            }
        }
    }
} 