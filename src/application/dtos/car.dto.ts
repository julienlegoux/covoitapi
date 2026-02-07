export type CreateCarInput = {
	modele: string;
	marqueId: string;
	immatriculation: string;
};

export type UpdateCarInput = {
	modele?: string;
	marqueId?: string;
	immatriculation?: string;
};
