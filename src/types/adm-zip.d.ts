declare module 'adm-zip' {
    class AdmZip {
        constructor(filePath: string);
        extractAllTo(path: string, overwrite: boolean): void;
    }
    export default AdmZip;
} 