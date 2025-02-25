import axios from 'axios';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';

interface GithubRelease {
    tag_name: string;
    assets: {
        name: string;
        browser_download_url: string;
    }[];
}

interface GithubContent {
    name: string;
    path: string;
    type: string;
    download_url: string | null;
}

export class GithubService {
    private tempDir: string;

    constructor() {
        this.tempDir = path.join(os.tmpdir(), 'pawn-package-temp');
        fs.ensureDirSync(this.tempDir);
    }

    /**
     * Get the latest release from a GitHub repository
     */
    async getLatestRelease(owner: string, repo: string): Promise<GithubRelease | null> {
        try {
            const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/releases/latest`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching latest release for ${owner}/${repo}: ${error}`);
            return null;
        }
    }

    /**
     * Download a file from a URL to a temporary location
     */
    async downloadFile(url: string, filename: string): Promise<string> {
        const filePath = path.join(this.tempDir, filename);
        
        try {
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'arraybuffer'
            });
            
            await fs.writeFile(filePath, response.data);
            return filePath;
        } catch (error) {
            throw new Error(`Failed to download file from ${url}: ${error}`);
        }
    }

    /**
     * Get contents of a directory in a GitHub repository
     */
    async getRepositoryContents(owner: string, repo: string, path: string = ''): Promise<GithubContent[]> {
        try {
            const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching repository contents for ${owner}/${repo}/${path}: ${error}`);
            return [];
        }
    }

    /**
     * Download include files from a GitHub repository
     */
    async downloadIncludeFiles(owner: string, repo: string, targetDir: string): Promise<string[]> {
        const downloadedFiles: string[] = [];
        
        try {
            const contents = await this.getRepositoryContents(owner, repo);
            
            // Find include files and directories
            for (const item of contents) {
                if (item.type === 'file' && item.name.endsWith('.inc') && item.download_url) {
                    const filePath = path.join(targetDir, item.name);
                    const response = await axios({
                        method: 'GET',
                        url: item.download_url,
                        responseType: 'arraybuffer'
                    });
                    
                    await fs.writeFile(filePath, response.data);
                    downloadedFiles.push(filePath);
                } else if (item.type === 'dir' && item.path.includes('include')) {
                    const subContents = await this.getRepositoryContents(owner, repo, item.path);
                    
                    for (const subItem of subContents) {
                        if (subItem.type === 'file' && subItem.name.endsWith('.inc') && subItem.download_url) {
                            const filePath = path.join(targetDir, subItem.name);
                            const response = await axios({
                                method: 'GET',
                                url: subItem.download_url,
                                responseType: 'arraybuffer'
                            });
                            
                            await fs.writeFile(filePath, response.data);
                            downloadedFiles.push(filePath);
                        }
                    }
                }
            }
            
            return downloadedFiles;
        } catch (error) {
            console.error(`Error downloading include files from ${owner}/${repo}: ${error}`);
            return downloadedFiles;
        }
    }

    /**
     * Download plugin files from the latest release of a GitHub repository
     */
    async downloadPluginFiles(owner: string, repo: string, targetDir: string): Promise<string[]> {
        const downloadedFiles: string[] = [];
        
        try {
            const release = await this.getLatestRelease(owner, repo);
            if (!release) {
                return downloadedFiles;
            }
            
            for (const asset of release.assets) {
                if (asset.name.endsWith('.dll') || asset.name.endsWith('.so')) {
                    const filePath = path.join(targetDir, asset.name);
                    const response = await axios({
                        method: 'GET',
                        url: asset.browser_download_url,
                        responseType: 'arraybuffer'
                    });
                    
                    await fs.writeFile(filePath, response.data);
                    downloadedFiles.push(filePath);
                }
            }
            
            return downloadedFiles;
        } catch (error) {
            console.error(`Error downloading plugin files from ${owner}/${repo}: ${error}`);
            return downloadedFiles;
        }
    }

    /**
     * Clean up temporary files
     */
    async cleanup(): Promise<void> {
        try {
            await fs.remove(this.tempDir);
        } catch (error) {
            console.error(`Error cleaning up temporary files: ${error}`);
        }
    }
} 