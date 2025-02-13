import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface WorkspacePaths {
    rootPath: string;
    pawnoPath?: string;
    qawnoPath?: string;
}

export function createDirectoryIfNotExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

export async function scanWorkspace(): Promise<WorkspacePaths> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    if (!workspaceFolders) {
        throw new Error('No workspace folder found');
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    let pawnoPath: string | undefined;
    let qawnoPath: string | undefined;

    const scanDirectory = (dirPath: string) => {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const fullPath = path.join(dirPath, entry.name);
                if (entry.name.toLowerCase() === 'pawno') {
                    pawnoPath = fullPath;
                } else if (entry.name.toLowerCase() === 'qawno') {
                    qawnoPath = fullPath;
                } else {
                    scanDirectory(fullPath);
                }
            }
        }
    };

    scanDirectory(rootPath);

    return {
        rootPath,
        pawnoPath,
        qawnoPath
    };
} 