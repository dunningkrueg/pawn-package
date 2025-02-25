import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import glob from 'glob';

/**
 * Finds all include directories in the workspace
 */
export async function findIncludeDirectories(): Promise<string[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return [];
    }

    const includeDirectories: string[] = [];
    
    for (const folder of workspaceFolders) {
        const folderPath = folder.uri.fsPath;
        
        
        const specificPaths = [
            path.join(folderPath, 'pawno', 'include'),
            path.join(folderPath, 'qawno', 'include'),
            path.join(folderPath, 'include')
        ];
        
        for (const specificPath of specificPaths) {
            if (fs.existsSync(specificPath) && fs.statSync(specificPath).isDirectory()) {
                if (!includeDirectories.includes(specificPath)) {
                    includeDirectories.push(specificPath);
                }
            }
        }
        
        
        const patterns = [
            path.join(folderPath, '**/pawno/include'),
            path.join(folderPath, '**/qawno/include'),
            path.join(folderPath, '**/include')
        ];
        
        for (const pattern of patterns) {
            try {
                const matches = await new Promise<string[]>((resolve, reject) => {
                    glob(pattern, { nodir: false }, (err: Error | null, matches: string[]) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(matches);
                        }
                    });
                });
                
                
                for (const match of matches) {
                    if (!includeDirectories.includes(match) && fs.existsSync(match) && fs.statSync(match).isDirectory()) {
                        includeDirectories.push(match);
                    }
                }
            } catch (error) {
                console.error(`Error searching for include directories: ${error}`);
            }
        }
    }
    
    console.log('Found include directories:', includeDirectories);
    return includeDirectories;
}

/**
 * Finds all plugin directories in the workspace
 */
export async function findPluginDirectories(): Promise<string[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return [];
    }

    const pluginDirectories: string[] = [];
    
    for (const folder of workspaceFolders) {
        const folderPath = folder.uri.fsPath;
        
        
        const specificPaths = [
            path.join(folderPath, 'plugins'),
            path.join(folderPath, 'pawno', 'plugins'),
            path.join(folderPath, 'qawno', 'plugins')
        ];
        
        for (const specificPath of specificPaths) {
            if (fs.existsSync(specificPath) && fs.statSync(specificPath).isDirectory()) {
                if (!pluginDirectories.includes(specificPath)) {
                    pluginDirectories.push(specificPath);
                }
            }
        }
        
        
        const patterns = [
            path.join(folderPath, '**/plugins'),
            path.join(folderPath, '**/pawno/plugins'),
            path.join(folderPath, '**/qawno/plugins')
        ];
        
        for (const pattern of patterns) {
            try {
                const matches = await new Promise<string[]>((resolve, reject) => {
                    glob(pattern, { nodir: false }, (err: Error | null, matches: string[]) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(matches);
                        }
                    });
                });
                
               
                for (const match of matches) {
                    if (!pluginDirectories.includes(match) && fs.existsSync(match) && fs.statSync(match).isDirectory()) {
                        pluginDirectories.push(match);
                    }
                }
            } catch (error) {
                console.error(`Error searching for plugin directories: ${error}`);
            }
        }
    }
    
    console.log('Found plugin directories:', pluginDirectories);
    return pluginDirectories;
}

/**
 * Ensures a directory exists, creating it if necessary
 */
export async function ensureDirectory(directory: string): Promise<void> {
    try {
        await fs.ensureDir(directory);
    } catch (error) {
        throw new Error(`Failed to create directory ${directory}: ${error}`);
    }
}

/**
 * Copies a file to a destination
 */
export async function copyFile(source: string, destination: string): Promise<void> {
    try {
        await fs.copy(source, destination, { overwrite: true });
    } catch (error) {
        throw new Error(`Failed to copy file from ${source} to ${destination}: ${error}`);
    }
}

/**
 * Writes content to a file
 */
export async function writeFile(filePath: string, content: string | Buffer): Promise<void> {
    try {
        await fs.writeFile(filePath, content);
    } catch (error) {
        throw new Error(`Failed to write to file ${filePath}: ${error}`);
    }
}

/**
 * Checks if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
    try {
        return await fs.pathExists(filePath);
    } catch (error) {
        console.error(`Error checking if file exists ${filePath}: ${error}`);
        return false;
    }
} 