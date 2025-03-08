export class Speziell {
    private static specialPlugins = [
        'amxsscanf.dll',
        'amxsscanf.so',
        'libmariadb.dll',
        'log-core.so',
        'log-core.dll'
    ];

    static isSpecialPlugin(filename: string): boolean {
        return this.specialPlugins.includes(filename.toLowerCase());
    }

    static shouldMoveToRoot(filename: string): boolean {
        return this.isSpecialPlugin(filename);
    }

    static getTargetPath(rootDir: string, pluginsDir: string, filename: string): string {
        if (this.shouldMoveToRoot(filename)) {
            return rootDir;
        }
        return pluginsDir;
    }
} 