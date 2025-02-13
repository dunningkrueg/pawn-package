import * as vscode from 'vscode';
import { DownloadPackageCommand } from './commands/downloadPackage';

export function activate(context: vscode.ExtensionContext) {
    const downloadCommand = new DownloadPackageCommand(context);
    
    let disposable = vscode.commands.registerCommand(
        'pawn-package.download',
        () => downloadCommand.execute()
    );

    context.subscriptions.push(disposable);

    vscode.window.showInformationMessage('Pawn Package is now active!');
}

export function deactivate() {} 