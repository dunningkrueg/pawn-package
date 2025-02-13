import axios from 'axios';

export class GitHubService {
    private readonly baseUrl = 'https://api.github.com';
    private readonly token: string;

    constructor(token?: string) {
        this.token = token || '';
    }

    async getLatestRelease(owner: string, repo: string) {
        const response = await axios.get(`${this.baseUrl}/repos/${owner}/${repo}/releases/latest`, {
            headers: this.token ? { Authorization: `token ${this.token}` } : {}
        });
        return response.data;
    }

    async downloadFile(url: string): Promise<Buffer> {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: this.token ? { Authorization: `token ${this.token}` } : {}
        });
        return response.data;
    }

    async getRepositoryContent(owner: string, repo: string, path: string = '') {
        const response = await axios.get(`${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`, {
            headers: this.token ? { Authorization: `token ${this.token}` } : {}
        });
        return response.data;
    }
} 