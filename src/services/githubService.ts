import axios from 'axios';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as tar from 'tar';
import decompress from 'decompress';
import AdmZip from 'adm-zip';
import { Speziell } from '../Speziell/Speziell';

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

interface ExtractedContent {
    plugins: string[];
    components: {
        source: string;
        target: string;
    }[];
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
        } catch (latestError) {
            try {
                const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/releases`);
                const releases = response.data;
                if (releases && releases.length > 0) {
                    return releases[0];
                }
                return null;
            } catch (error) {
                console.error(`Error fetching releases for ${owner}/${repo}: ${error}`);
                return null;
            }
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
        const tempExtractDir = path.join(this.tempDir, `${owner}-${repo}-include-extract`);
        
        try {
            await fs.ensureDir(tempExtractDir);
            const release = await this.getLatestRelease(owner, repo);
            let foundInRelease = false;

            // Try to get includes from release first
            if (release && release.assets) {
                for (const asset of release.assets) {
                    try {
                        const isArchive = asset.name.match(/\.(zip|tar\.gz|tgz|rar|7z)$/i);
                        const isInclude = asset.name.endsWith('.inc');

                        if (isInclude) {
                            const filePath = path.join(targetDir, asset.name);
                            const response = await axios({
                                method: 'GET',
                                url: asset.browser_download_url,
                                responseType: 'arraybuffer'
                            });
                            
                            await fs.writeFile(filePath, response.data);
                            downloadedFiles.push(filePath);
                            foundInRelease = true;
                        } else if (isArchive) {
                            const archivePath = path.join(this.tempDir, asset.name);
                            const response = await axios({
                                method: 'GET',
                                url: asset.browser_download_url,
                                responseType: 'arraybuffer'
                            });
                            
                            await fs.writeFile(archivePath, response.data);
                            
                            // Extract and check for includes
                            if (archivePath.endsWith('.zip')) {
                                const zip = new AdmZip(archivePath);
                                zip.extractAllTo(tempExtractDir, true);
                            } else if (archivePath.endsWith('.tar.gz') || archivePath.endsWith('.tgz')) {
                                await tar.extract({
                                    file: archivePath,
                                    cwd: tempExtractDir
                                });
                            } else {
                                await decompress(archivePath, tempExtractDir);
                            }

                            // Find all .inc files recursively
                            const findIncludes = async (dir: string) => {
                                const items = await fs.readdir(dir, { withFileTypes: true });
                                
                                for (const item of items) {
                                    const fullPath = path.join(dir, item.name);
                                    
                                    if (item.isDirectory()) {
                                        await findIncludes(fullPath);
                                    } else if (item.name.endsWith('.inc')) {
                                        const targetPath = path.join(targetDir, item.name);
                                        if (!downloadedFiles.includes(targetPath)) {
                                            await fs.copy(fullPath, targetPath);
                                            downloadedFiles.push(targetPath);
                                            foundInRelease = true;
                                        }
                                    }
                                }
                            };
                            
                            await findIncludes(tempExtractDir);
                            await fs.remove(archivePath);
                        }
                    } catch (downloadError) {
                        console.error(`Failed to process asset ${asset.name}: ${downloadError}`);
                    }
                }
            }

            // If no includes found in release, try repository
            if (!foundInRelease) {
                const contents = await this.getRepositoryContents(owner, repo);
                
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
            }
            
            await fs.remove(tempExtractDir);
            return downloadedFiles;
        } catch (error) {
            console.error(`Error downloading include files from ${owner}/${repo}: ${error}`);
            await fs.remove(tempExtractDir);
            return downloadedFiles;
        }
    }

    /**
     * Find plugins in a repository
     */
    async findPluginsInRepository(owner: string, repo: string, path: string = ''): Promise<GithubContent[]> {
        const plugins: GithubContent[] = [];
        
        try {
            const contents = await this.getRepositoryContents(owner, repo, path);
            
            for (const item of contents) {
                if (item.type === 'file') {
                    if ((item.name.endsWith('.dll') || item.name.endsWith('.so')) && item.download_url) {
                        plugins.push(item);
                    }
                } else if (item.type === 'dir') {
                    const subPlugins = await this.findPluginsInRepository(owner, repo, item.path);
                    plugins.push(...subPlugins);
                }
            }
        } catch (error) {
            console.error(`Error finding plugins in ${owner}/${repo}/${path}: ${error}`);
        }
        
        return plugins;
    }

    private async extractArchive(archivePath: string, extractPath: string): Promise<ExtractedContent> {
        const result: ExtractedContent = {
            plugins: [],
            components: []
        };
        
        try {
            if (archivePath.endsWith('.zip')) {
                const zip = new AdmZip(archivePath);
                zip.extractAllTo(extractPath, true);
            } else if (archivePath.endsWith('.tar.gz') || archivePath.endsWith('.tgz')) {
                await tar.extract({
                    file: archivePath,
                    cwd: extractPath
                });
            } else {
                await decompress(archivePath, extractPath);
            }
            
            const findContent = async (dir: string, isInComponents: boolean = false) => {
                const items = await fs.readdir(dir, { withFileTypes: true });
                
                for (const item of items) {
                    const fullPath = path.join(dir, item.name);
                    
                    if (item.isDirectory()) {
                        if (item.name === 'components') {
                            await findContent(fullPath, true);
                        } else {
                            await findContent(fullPath, isInComponents);
                        }
                    } else if (item.name.endsWith('.dll') || item.name.endsWith('.so')) {
                        if (!isInComponents) {
                            result.plugins.push(fullPath);
                        }
                    }
                    
                    if (isInComponents) {
                        const relativePath = path.relative(extractPath, fullPath);
                        result.components.push({
                            source: fullPath,
                            target: relativePath
                        });
                    }
                }
            };
            
            await findContent(extractPath);
            return result;
        } catch (error) {
            console.error(`Error extracting archive ${archivePath}: ${error}`);
            return result;
        }
    }

    /**
     * Download plugin files from the latest release of a GitHub repository
     */
    async downloadPluginFiles(owner: string, repo: string, targetDir: string): Promise<string[]> {
        const downloadedFiles: string[] = [];
        const tempExtractDir = path.join(this.tempDir, `${owner}-${repo}-extract`);
        const rootDir = path.dirname(targetDir);
        
        try {
            await fs.ensureDir(tempExtractDir);
            const plugins = await this.findPluginsInRepository(owner, repo);
            const release = await this.getLatestRelease(owner, repo);
            
            if (release && release.assets) {
                for (const asset of release.assets) {
                    try {
                        const isArchive = asset.name.match(/\.(zip|tar\.gz|tgz|rar|7z)$/i);
                        const isPlugin = asset.name.endsWith('.dll') || asset.name.endsWith('.so');
                        
                        if (isPlugin) {
                            const targetPath = path.join(
                                Speziell.getTargetPath(rootDir, targetDir, asset.name),
                                asset.name
                            );
                            const response = await axios({
                                method: 'GET',
                                url: asset.browser_download_url,
                                responseType: 'arraybuffer'
                            });
                            
                            await fs.writeFile(targetPath, response.data);
                            downloadedFiles.push(targetPath);
                        } else if (isArchive) {
                            const archivePath = path.join(this.tempDir, asset.name);
                            const response = await axios({
                                method: 'GET',
                                url: asset.browser_download_url,
                                responseType: 'arraybuffer'
                            });
                            
                            await fs.writeFile(archivePath, response.data);
                            const extracted = await this.extractArchive(archivePath, tempExtractDir);
                            
                            // Handle regular plugins
                            for (const pluginPath of extracted.plugins) {
                                const fileName = path.basename(pluginPath);
                                const targetPath = path.join(
                                    Speziell.getTargetPath(rootDir, targetDir, fileName),
                                    fileName
                                );
                                
                                if (!downloadedFiles.includes(targetPath)) {
                                    await fs.copy(pluginPath, targetPath);
                                    downloadedFiles.push(targetPath);
                                }
                            }
                            
                            // Handle components
                            if (extracted.components.length > 0) {
                                const componentsDir = path.join(rootDir, 'components');
                                await fs.ensureDir(componentsDir);
                                
                                for (const component of extracted.components) {
                                    const targetPath = path.join(rootDir, component.target);
                                    const componentDir = path.dirname(targetPath);
                                    
                                    await fs.ensureDir(componentDir);
                                    await fs.copy(component.source, targetPath);
                                }
                            }
                            
                            await fs.remove(archivePath);
                        }
                    } catch (downloadError) {
                        console.error(`Failed to process asset ${asset.name}: ${downloadError}`);
                    }
                }
            }
            
            // Handle plugins from repository
            for (const plugin of plugins) {
                const isInComponents = plugin.path.includes('components/');
                if (!isInComponents && plugin.download_url && (plugin.name.endsWith('.dll') || plugin.name.endsWith('.so'))) {
                    try {
                        const targetPath = path.join(
                            Speziell.getTargetPath(rootDir, targetDir, plugin.name),
                            plugin.name
                        );
                        if (!downloadedFiles.includes(targetPath)) {
                            const response = await axios({
                                method: 'GET',
                                url: plugin.download_url,
                                responseType: 'arraybuffer'
                            });
                            
                            await fs.writeFile(targetPath, response.data);
                            downloadedFiles.push(targetPath);
                        }
                    } catch (downloadError) {
                        console.error(`Failed to download plugin ${plugin.name}: ${downloadError}`);
                    }
                }
            }
            
            await fs.remove(tempExtractDir);
            return downloadedFiles;
        } catch (error) {
            console.error(`Error downloading plugin files from ${owner}/${repo}: ${error}`);
            await fs.remove(tempExtractDir);
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