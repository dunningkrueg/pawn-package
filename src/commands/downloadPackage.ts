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
        // Check if workspace has valid directories
        const context = getExtensionContext();
        const hasValidDirectories = context.globalState.get('hasValidDirectories', false);
        
        // If no valid directories, run scan and check again
        if (!hasValidDirectories) {
            const scanResult = await scanWorkspace();
            if (!scanResult) {
                vscode.window.showErrorMessage('Cannot download package: No valid include or plugin directories found. Please create pawno/include, qawno/include, or plugins directory in your workspace.');
                return;
            }
        }
        
        // Get repository information from user
        const repoInput = await vscode.window.showInputBox({
            prompt: 'Enter GitHub repository (format: owner/repo)',
            placeHolder: 'e.g. owner/repo'
        });
        
        if (!repoInput) {
            return;
        }
        
        // Validate input format
        const [owner, repo] = repoInput.split('/');
        if (!owner || !repo) {
            vscode.window.showErrorMessage('Invalid repository format. Please use owner/repo format.');
            return;
        }
        
        // Show progress
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Downloading package ${owner}/${repo}`,
            cancellable: true
        }, async (progress, token) => {
            // Create GitHub service
            const githubService = new GithubService();
            
            try {
                // Get directories from extension context
                const includeDirectories: string[] = context.globalState.get('includeDirectories', []);
                const pluginDirectories: string[] = context.globalState.get('pluginDirectories', []);
                
                // Download include files
                if (includeDirectories.length > 0) {
                    progress.report({ message: 'Downloading include files...' });
                    
                    // Use the first include directory
                    const includeDir = includeDirectories[0];
                    await ensureDirectory(includeDir);
                    
                    const downloadedIncludes = await githubService.downloadIncludeFiles(owner, repo, includeDir);
                    if (downloadedIncludes.length > 0) {
                        vscode.window.showInformationMessage(`Downloaded ${downloadedIncludes.length} include files to ${includeDir}`);
                    } else {
                        vscode.window.showInformationMessage(`No include files found in ${owner}/${repo}`);
                    }
                }
                
                // Download plugin files
                if (pluginDirectories.length > 0) {
                    progress.report({ message: 'Downloading plugin files...' });
                    
                    // Use the first plugin directory
                    const pluginDir = pluginDirectories[0];
                    await ensureDirectory(pluginDir);
                    
                    const downloadedPlugins = await githubService.downloadPluginFiles(owner, repo, pluginDir);
                    if (downloadedPlugins.length > 0) {
                        vscode.window.showInformationMessage(`Downloaded ${downloadedPlugins.length} plugin files to ${pluginDir}`);
                    } else {
                        vscode.window.showInformationMessage(`No plugin files found in latest release of ${owner}/${repo}`);
                    }
                }
                
                // Clean up
                await githubService.cleanup();
                
                vscode.window.showInformationMessage(`Package ${owner}/${repo} downloaded successfully!`);
            } catch (error) {
                vscode.window.showErrorMessage(`Error downloading package: ${error}`);
                
                // Clean up on error
                await githubService.cleanup();
            }
        });
    } catch (error) {
        vscode.window.showErrorMessage(`Error downloading package: ${error}`);
    }
} 