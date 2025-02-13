import * as vscode from 'vscode';
import { PackageManager } from '../services/packageManager';

export class DownloadPackageCommand {
    constructor(private context: vscode.ExtensionContext) {}

    async execute() {
        const packageManager = new PackageManager(this.context);

        const packageInput = await vscode.window.showInputBox({
            placeHolder: 'Enter package (e.g. owner/repos)',
            prompt: 'Enter the GitHub repository in format owner/repo',
            validateInput: this.validatePackageInput
        });

        if (!packageInput) {
            return;
        }

        const [owner, repo] = packageInput.split('/');

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Downloading package ${packageInput}`,
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Initializing...' });
                
                await packageManager.initialize();
                progress.report({ increment: 30, message: 'Downloading files...' });
                
                await packageManager.downloadPackage(`${owner}/${repo}`);
                progress.report({ increment: 70, message: 'Finalizing...' });
                
                progress.report({ increment: 100, message: 'Complete!' });
            });

            vscode.window.showInformationMessage(`Successfully installed ${packageInput}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Failed to install package: ${errorMessage}`);
            throw error;
        }
    }

    private validatePackageInput(value: string): string | null {
        if (!value) {
            return 'Package name cannot be empty';
        }

        if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value)) {
            return 'Invalid package format. Use owner/repo format (e.g. Y-Less/sscanf)';
        }

        return null;
    }
} 