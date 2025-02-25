import * as vscode from 'vscode';
import * as path from 'path';
import { GithubService } from '../services/githubService';
import { ensureDirectory } from '../utils/fileUtils';
import { getExtensionContext } from '../extension';
import { scanWorkspace } from './scanWorkspace';

/**
 * Downloads a package from GitHub
 */
export async function downloadPackage(): Promise<void> {
    try {
        const context = getExtensionContext();
        const hasValidDirectories = context.globalState.get('hasValidDirectories', false);
        
        if (!hasValidDirectories) {
            const scanResult = await scanWorkspace();
            if (!scanResult) {
                vscode.window.showErrorMessage('Cannot download package: No valid include or plugin directories found. Please create pawno/include, qawno/include, or plugins directory in your workspace.');
                return;
            }
        }
        
        const repoInput = await vscode.window.showInputBox({
            prompt: 'Enter GitHub repository (format: owner/repo)',
            placeHolder: 'e.g. owner/repo'
        });
        
        if (!repoInput) {
            return;
        }
        
        const [owner, repo] = repoInput.split('/');
        if (!owner || !repo) {
            vscode.window.showErrorMessage('Invalid repository format. Please use owner/repo format.');
            return;
        }
        
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Downloading package ${owner}/${repo}`,
            cancellable: true
        }, async (progress, token) => {
            const githubService = new GithubService();
            
            try {
                const includeDirectories: string[] = context.globalState.get('includeDirectories', []);
                const pluginDirectories: string[] = context.globalState.get('pluginDirectories', []);
                
                if (includeDirectories.length > 0) {
                    progress.report({ message: 'Downloading include files...' });
                    
                    const includeDir = includeDirectories[0];
                    await ensureDirectory(includeDir);
                    
                    const downloadedIncludes = await githubService.downloadIncludeFiles(owner, repo, includeDir);
                    if (downloadedIncludes.length > 0) {
                        vscode.window.showInformationMessage(`Downloaded ${downloadedIncludes.length} include files to ${includeDir}`);
                    } else {
                        vscode.window.showInformationMessage(`No include files found in ${owner}/${repo}`);
                    }
                }
                
                if (pluginDirectories.length > 0) {
                    progress.report({ message: 'Downloading plugin files...' });
                    
                    const pluginDir = pluginDirectories[0];
                    await ensureDirectory(pluginDir);
                    
                    const downloadedPlugins = await githubService.downloadPluginFiles(owner, repo, pluginDir);
                    if (downloadedPlugins.length > 0) {
                        vscode.window.showInformationMessage(`Downloaded ${downloadedPlugins.length} plugin files to ${pluginDir}`);
                    } else {
                        vscode.window.showInformationMessage(`No plugin files found in latest release of ${owner}/${repo}`);
                    }
                }
                
                await githubService.cleanup();
                
                vscode.window.showInformationMessage(`Package ${owner}/${repo} downloaded successfully!`);
            } catch (error) {
                vscode.window.showErrorMessage(`Error downloading package: ${error}`);
                
                await githubService.cleanup();
            }
        });
    } catch (error) {
        vscode.window.showErrorMessage(`Error downloading package: ${error}`);
    }
} 