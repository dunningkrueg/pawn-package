import * as vscode from 'vscode';
import * as path from 'path';
import { findIncludeDirectories, findPluginDirectories, ensureDirectory } from '../utils/fileUtils';
import { getExtensionContext } from '../extension';

/**
 * Scans the workspace for include and plugin directories
 * Creates them if they don't exist
 */
export async function scanWorkspace(): Promise<boolean> {
    try {
        // Find include directories
        const includeDirectories = await findIncludeDirectories();
        
        // Find plugin directories
        const pluginDirectories = await findPluginDirectories();
        
        // Check if any valid directories were found
        const hasValidDirectories = includeDirectories.length > 0 || pluginDirectories.length > 0;
        
        // Store directories in global state for later use
        const context = getExtensionContext();
        context.globalState.update('includeDirectories', includeDirectories);
        context.globalState.update('pluginDirectories', pluginDirectories);
        context.globalState.update('hasValidDirectories', hasValidDirectories);
        
        // Show found directories
        if (hasValidDirectories) {
            const includeMsg = includeDirectories.length > 0 
                ? `Include directories: ${includeDirectories.map(d => path.basename(path.dirname(d)) + '/' + path.basename(d)).join(', ')}`
                : 'No include directories found';
                
            const pluginMsg = pluginDirectories.length > 0
                ? `Plugin directories: ${pluginDirectories.map(d => path.basename(d)).join(', ')}`
                : 'No plugin directories found';
                
            vscode.window.showInformationMessage(`Workspace scan complete. ${includeMsg}. ${pluginMsg}`);
        } else {
            vscode.window.showWarningMessage('No include or plugin directories found. Please create pawno/include, qawno/include, or plugins directory in your workspace.');
        }
        
        return hasValidDirectories;
    } catch (error) {
        vscode.window.showErrorMessage(`Error scanning workspace: ${error}`);
        return false;
    }
} 