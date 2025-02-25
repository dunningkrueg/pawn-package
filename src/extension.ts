import * as vscode from 'vscode';
import { downloadPackage } from './commands/downloadPackage';
import { scanWorkspace } from './commands/scanWorkspace';

let extensionContext: vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext) {
    console.log('Pawn Package extension is now active!');
    
    extensionContext = context;
    
    context.subscriptions.push(
        vscode.commands.registerCommand('pawnPackage.downloadPackage', downloadPackage),
        vscode.commands.registerCommand('pawnPackage.scanWorkspace', scanWorkspace)
    );

    scanWorkspace().then(hasValidDirectories => {
        if (hasValidDirectories) {
            console.log('Valid directories found in workspace');
        } else {
            console.log('No valid directories found in workspace');
        }
    }).catch(error => {
        console.error('Error scanning workspace:', error);
    });
}

export function deactivate() {
    
}

export function getExtensionContext(): vscode.ExtensionContext {
    return extensionContext;
} 