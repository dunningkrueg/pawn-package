export interface GithubRelease {
    id: number;
    tag_name: string;
    name: string;
    assets: GithubAsset[];
    body: string;
    created_at: string;
    published_at: string;
}

export interface GithubAsset {
    id: number;
    name: string;
    size: number;
    browser_download_url: string;
    content_type: string;
}

export interface GithubContent {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string;
    type: string;
}

export interface PackageConfig {
    dependencies?: { [key: string]: string };
    include?: string[];
    plugins?: string[];
} 