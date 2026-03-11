interface DownloadStatusActive {
    inProgress: boolean;
    message: string;
    id: number;
    type: "group" | "nomi";
}

interface DownloadStatusInactive {
    inProgress: boolean;
    message: string;
    id: null;
    type: null;
}

export type DownloadStatus = DownloadStatusActive | DownloadStatusInactive;
