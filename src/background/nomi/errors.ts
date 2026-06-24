export interface NomiErrorProps {
    id?: number;
    message: string;
}

export class NomiError extends Error {
    public id: number | null;

    constructor({ id, message }: NomiErrorProps) {
        super(message);
        this.name = "Nomi Error";
        this.id = id ?? null;
    }
}
