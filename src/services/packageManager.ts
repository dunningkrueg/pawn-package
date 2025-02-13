import * as vscode from 'vscode';
import * as path from 'path';
import { GitHubService } from './githubService';
import { FileSystemService } from './fileSystem';
import { scanWorkspace } from '../utils/scanners';
import { PathUtils } from '../utils/pathUtils';
import { PackageConfig } from '../types';
import { AlternativeDownloader } from './alternativeDownloader';

export class PackageManager {
    private githubService: GitHubService;
    private alternativeDownloader: AlternativeDownloader;
    private workspacePaths!: { rootPath: string; pawnoPath?: string; qawnoPath?: string; };
    private readonly stateKey = 'installedPackages';

    constructor(private context: vscode.ExtensionContext) {
        this.githubService = new GitHubService();
        this.alternativeDownloader = new AlternativeDownloader();
    }

    async downloadPackage(input: string): Promise<void> {
        await this.initialize();

        const includePath = this.getIncludePath();
        const pluginsPath = this.getPluginsPath();

        await FileSystemService.ensureDirectory(includePath);
        await FileSystemService.ensureDirectory(pluginsPath);

        try {
            if (input.includes('/')) {
                const [owner, repo] = input.split('/');
                await this.downloadFromGithub(owner, repo, pluginsPath, includePath);
            } else {
                await this.alternativeDownloader.downloadFromCustomSource(
                    input,
                    pluginsPath,
                    includePath
                );
            }

            await this.saveInstalledPackage(input);
            await this.updatePackageConfig(path.join(this.workspacePaths.rootPath, 'pawn-package.json'), input);
        } catch (error) {
            console.error('Primary download method failed, trying alternative sources...');
            
            try {
                await this.alternativeDownloader.downloadFromMirror(
                    input,
                    pluginsPath
                );
                await this.saveInstalledPackage(input);
            } catch (mirrorError) {
                throw new Error(`Failed to download package from all sources: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        await this.alternativeDownloader.scanAndOrganizeFiles(
            this.workspacePaths.rootPath,
            pluginsPath,
            includePath
        );
    }

    private async downloadFromGithub(owner: string, repo: string, pluginsPath: string, includePath: string): Promise<void> {
        const [release, contents] = await Promise.all([
            this.githubService.getLatestRelease(owner, repo),
            this.githubService.getRepositoryContent(owner, repo)
        ]);

        const downloadPromises: Promise<void>[] = [];

        for (const asset of release.assets) {
            if (PathUtils.isPluginFile(asset.name)) {
                const fileBuffer = await this.githubService.downloadFile(asset.browser_download_url);
                downloadPromises.push(
                    FileSystemService.saveFile(path.join(pluginsPath, asset.name), fileBuffer)
                );
            }
        }

        for (const content of contents) {
            if (PathUtils.isIncludeFile(content.name)) {
                const fileBuffer = await this.githubService.downloadFile(content.download_url);
                downloadPromises.push(
                    FileSystemService.saveFile(path.join(includePath, content.name), fileBuffer)
                );
            }
        }

        await Promise.all(downloadPromises);
    }

    private async saveInstalledPackage(packageId: string): Promise<void> {
        const installedPackages = this.context.globalState.get<string[]>(this.stateKey, []);
        
        if (!installedPackages.includes(packageId)) {
            installedPackages.push(packageId);
            await this.context.globalState.update(this.stateKey, installedPackages);
        }
    }

    private async updatePackageConfig(configPath: string, packageId: string): Promise<void> {
        let config: PackageConfig = { dependencies: {} };

        try {
            if (await FileSystemService.fileExists(configPath)) {
                const content = await FileSystemService.readFile(configPath);
                config = JSON.parse(content.toString());
            }
        } catch {}

        config.dependencies = config.dependencies || {};
        config.dependencies[packageId] = '*';

        await FileSystemService.saveFile(
            configPath,
            Buffer.from(JSON.stringify(config, null, 2))
        );
    }

    private getIncludePath(): string {
        if (this.workspacePaths.pawnoPath) {
            return path.join(this.workspacePaths.pawnoPath, 'include');
        }
        if (this.workspacePaths.qawnoPath) {
            return path.join(this.workspacePaths.qawnoPath, 'include');
        }
        throw new Error('No Pawno or Qawno directory found');
    }

    private getPluginsPath(): string {
        return path.join(this.workspacePaths.rootPath, 'plugins');
    }

    async initialize(): Promise<void> {
        this.workspacePaths = await scanWorkspace();
        if (!this.workspacePaths.rootPath) {
            throw new Error('No workspace folder found');
        }
    }

    async isPackageInstalled(packageId: string): Promise<boolean> {
        const installedPackages = this.context.globalState.get<string[]>(this.stateKey, []);
        return installedPackages.includes(packageId);
    }
} 