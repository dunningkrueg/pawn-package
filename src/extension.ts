import * as vscode from 'vscode';
import { DownloadPackageCommand } from './commands/downloadPackage';

export async function activate(context: vscode.ExtensionContext) {
    try {
        const downloadCommand = new DownloadPackageCommand(context);
        
        let disposable = vscode.commands.registerCommand(
            'pawn.download',
            async () => {
                try {
                    await downloadCommand.execute();
                } catch (error) {
                    vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
        );

        context.subscriptions.push(disposable);
        
        vscode.window.showInformationMessage('Pawn Package activated successfully');
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to activate Pawn Package: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export function deactivate() {} 