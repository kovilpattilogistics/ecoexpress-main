// Basic mock location service
export const ZONE_A_TOWNS = [
    "Kovilpatti",
    "Kalugumalai",
    "Sankarankoil",
    "Tiruvengadam",
    "Nallatinputhur",
    "Vanaramutti",
    "Kayatar",
    "Ettayapuram",
    "Sattur",
    "Vilathikulam"
];

export function getDistanceMock(origin: string, destination: string): number {
    // Simple deterministic mock distance based on string length hash or predefined
    // In real app, this calls Google Maps API
    if (!destination) return 0;

    // Mock distances from Kovilpatti
    const mockDistances: Record<string, number> = {
        "Kalugumalai": 22,
        "Sankarankoil": 41,
        "Tiruvengadam": 35,
        "Nallatinputhur": 12,
        "Vanaramutti": 15,
        "Kayatar": 28,
        "Ettayapuram": 32,
        "Sattur": 24,
        "Vilathikulam": 45
    };

    // Find partial match
    const match = Object.keys(mockDistances).find(town =>
        destination.toLowerCase().includes(town.toLowerCase())
    );

    return match ? mockDistances[match] : Math.floor(Math.random() * 30) + 10;
}
