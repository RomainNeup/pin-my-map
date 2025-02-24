/**
 * Place interface
 */
export interface Place {
    /**
     * Place id
     */
    id: string;
    name: string;
    location: { lat: number, lng: number };
    address: string;
    description: string;
    image: string;
}
