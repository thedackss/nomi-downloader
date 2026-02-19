import type { NomiExistsProps } from "./exists";

export interface GetMediasProps extends NomiExistsProps {
    onProgress?: (message: string) => void;
}
